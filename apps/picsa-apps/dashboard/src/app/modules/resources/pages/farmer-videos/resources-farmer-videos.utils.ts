import {
  COUNTRIES_DATA_HASHMAP,
  ICountryCode,
  ILocaleCode,
  ILocaleDataEntry,
  LOCALES_DATA_HASHMAP,
} from '@picsa/data/deployments';
import {
  IPicsaVideo,
  PICSA_FARMER_VIDEOS_DATA,
  PICSA_INTRO_VIDEOS_DATA,
  PICSA_VIDEO_TESTIMONIAL_DATA,
} from '@picsa/data/resources';

export type VideoCategory = 'intro' | 'step' | 'testimonial';

export type TranslationCellStatus = 'audio' | 'subtitled' | 'missing' | 'not_applicable';

export interface IFarmerVideoConfig {
  id: string;
  title: string;
  category: VideoCategory;
  stepNumber?: number;
  useLocalizedEn?: boolean;
  countryCode?: ICountryCode;
  children: IPicsaVideo[];
}

export interface ITranslationCell {
  status: TranslationCellStatus;
  variant?: IPicsaVideo;
  isSubtitled?: boolean;
}

export interface IFarmerVideoMatrixRow {
  id: string;
  title: string;
  category: VideoCategory;
  categoryLabel: string;
  stepNumber?: number;
  children: IPicsaVideo[];
  cells: Record<string, ITranslationCell>;
  availableCount: number;
  applicableCount: number;
  totalSizeKb: number;
}

export interface IVideoPreviewData {
  videoTitle: string;
  videoId: string;
  localeLabel: string;
  countryName: string;
  localeCode: string;
  resolution: string;
  sizeKb: number;
  url: string;
  isSubtitled?: boolean;
}

export interface IFarmerVideoStats {
  totalVideos: number;
  targetVideos: number;
  availableVideos: number;
  totalSizeMb: number;
  localeCount: number;
  languageCount: number;
  coveragePercent: number;
}

/**
 * Derives the complete list of all direct-to-farmer videos.
 * Includes intro, the 8 PICSA steps, and farmer testimonials.
 */
export function getDirectToFarmerVideos(): IFarmerVideoConfig[] {
  const list: IFarmerVideoConfig[] = [];

  // 1. Farmer Intro Video
  const introData = PICSA_INTRO_VIDEOS_DATA.find((v) => v.id === 'intro');
  if (introData) {
    list.push({
      id: 'intro',
      title: 'What is PICSA? (Introduction)',
      category: 'intro',
      children: introData.children,
    });
  }

  // 2. PICSA Steps 1-8
  for (let i = 0; i < PICSA_FARMER_VIDEOS_DATA.length; i++) {
    const step = PICSA_FARMER_VIDEOS_DATA[i];
    const stepNumber = i + 1;
    const config: IFarmerVideoConfig = {
      id: step.id,
      title: step.title || step.id,
      category: 'step',
      stepNumber,
      children: step.children,
    };
    // Steps 7 and 8 expect localized English
    if (stepNumber === 7 || stepNumber === 8) {
      config.useLocalizedEn = true;
    }
    list.push(config);
  }

  // 3. Testimonials (tagged with their country and using localized English with subtitles)
  const countryByTestimonialId: Record<string, ICountryCode> = {
    jackline_nkhoma: 'mw',
    dani_chambwe: 'mw',
    john_tembo: 'zm',
    victoria_ngombe: 'zm',
  };

  for (const item of PICSA_VIDEO_TESTIMONIAL_DATA) {
    const country = countryByTestimonialId[item.id];
    list.push({
      id: item.id,
      title: item.title ? `Testimonial: ${item.title}` : `Testimonial: ${item.id}`,
      category: 'testimonial',
      countryCode: country,
      useLocalizedEn: true,
      children: item.children,
    });
  }

  return list;
}

/**
 * Filters the master video list according to the active deployment country.
 */
export function getVideosForCountry(
  videos: IFarmerVideoConfig[],
  countryCode: string | undefined | null,
): IFarmerVideoConfig[] {
  if (!countryCode || countryCode === 'global') {
    return videos;
  }
  return videos.filter((video) => {
    // Intro and Steps are relevant to all deployments
    if (video.category === 'intro' || video.category === 'step') {
      return true;
    }
    // Testimonials are specific to country
    if (video.category === 'testimonial') {
      return video.countryCode === countryCode;
    }
    return true;
  });
}

/**
 * Derives the active locales to display for a given country deployment.
 * Always includes global_en + all locales configured for that country.
 */
export function getLocalesForCountry(
  allLocales: ILocaleDataEntry[],
  countryCode: string | undefined | null,
): ILocaleDataEntry[] {
  if (!countryCode || countryCode === 'global') {
    return allLocales;
  }
  return allLocales.filter((locale) => locale.id === 'global_en' || locale.country_code === countryCode);
}

/**
 * Determines whether a given locale is applicable for a video.
 * Handles country scoping and English expectation rule:
 * - If video has countryCode set (e.g. testimonials), other countries' locales are N/A.
 * - If useLocalizedEn is true: only localized English (e.g. mw_en, zm_en) is expected. global_en is N/A.
 * - If useLocalizedEn is not true: only global_en is expected. Localized English is N/A.
 * - Other languages for the video's country are always applicable.
 */
export function isLocaleApplicable(video: IFarmerVideoConfig, localeCode: string): boolean {
  // If video is country-specific (e.g. testimonials), locales from other countries are not applicable
  if (video.countryCode && localeCode !== 'global_en') {
    const localeCountry = localeCode.split('_')[0];
    if (localeCountry !== video.countryCode) {
      return false;
    }
  }

  const isEnglish = localeCode.endsWith('_en');

  if (isEnglish) {
    if (localeCode === 'global_en') {
      return !video.useLocalizedEn;
    } else {
      return !!video.useLocalizedEn;
    }
  }

  // Non-English languages are applicable for their respective country
  return true;
}

/**
 * Evaluates the status of a specific video variant for a target locale code.
 */
export function evaluateTranslationCell(video: IFarmerVideoConfig, localeCode: string): ITranslationCell {
  if (!isLocaleApplicable(video, localeCode)) {
    return { status: 'not_applicable' };
  }

  // Find a matching child that includes this locale code
  const variant = video.children.find((child) => child.locale_codes.includes(localeCode as ILocaleCode));

  if (!variant) {
    return { status: 'missing' };
  }

  // Check if English is provided via subtitles (i.e. secondary locale code in video)
  const isEnglish = localeCode.endsWith('_en');
  const isSubtitled = isEnglish && variant.locale_codes.length > 1 && variant.locale_codes[0] !== localeCode;

  return {
    status: isSubtitled ? 'subtitled' : 'audio',
    variant,
    isSubtitled,
  };
}

/**
 * Formats a user-friendly country label.
 */
export function getCountryLabel(countryCode: string): string {
  if (countryCode === 'all' || countryCode === 'global') return 'Global';
  const entry = COUNTRIES_DATA_HASHMAP[countryCode as ICountryCode];
  if (entry?.label) return entry.label;
  if (countryCode === 'tj') return 'Tajikistan';
  return countryCode.toUpperCase();
}

/**
 * Returns human-readable list of languages in a video variant.
 */
export function formatVariantLanguages(variant: IPicsaVideo): string {
  return variant.locale_codes.map((code) => LOCALES_DATA_HASHMAP[code]?.language_label || code).join(', ');
}

/**
 * Returns country code and label for a video variant.
 */
export function formatVariantCountry(variant: IPicsaVideo): { code: string; label: string } {
  const firstLocale = variant.locale_codes[0];
  const meta = LOCALES_DATA_HASHMAP[firstLocale];
  const countryCode = meta ? meta.country_code : firstLocale.split('_')[0];
  return {
    code: countryCode,
    label: getCountryLabel(countryCode),
  };
}

/**
 * Constructs rows for the translation matrix based on active locales and search query.
 */
export function buildMatrixRows(
  videos: IFarmerVideoConfig[],
  locales: ILocaleDataEntry[],
  searchTerm = '',
): IFarmerVideoMatrixRow[] {
  const search = searchTerm.trim().toLowerCase();

  return videos
    .map((video) => {
      const cells: Record<string, ITranslationCell> = {};
      let availableCount = 0;
      let applicableCount = 0;
      let totalSizeKb = 0;

      for (const child of video.children) {
        totalSizeKb += child.size_kb || 0;
      }

      for (const locale of locales) {
        const cell = evaluateTranslationCell(video, locale.id);
        cells[locale.id] = cell;

        if (cell.status !== 'not_applicable') {
          applicableCount++;
          if (cell.status === 'audio' || cell.status === 'subtitled') {
            availableCount++;
          }
        }
      }

      const categoryLabel =
        video.category === 'intro'
          ? 'Introduction'
          : video.category === 'testimonial'
            ? 'Testimonial'
            : `Step ${video.stepNumber}`;

      return {
        id: video.id,
        title: video.title,
        category: video.category,
        categoryLabel,
        stepNumber: video.stepNumber,
        children: video.children,
        cells,
        availableCount,
        applicableCount,
        totalSizeKb,
      };
    })
    .filter((row) => {
      if (!search) return true;
      return (
        row.title.toLowerCase().includes(search) ||
        row.id.toLowerCase().includes(search) ||
        row.categoryLabel.toLowerCase().includes(search)
      );
    });
}

/**
 * Computes summary statistics across the active videos and locales.
 */
export function calculateStats(rows: IFarmerVideoMatrixRow[], locales: ILocaleDataEntry[]): IFarmerVideoStats {
  const totalVideos = rows.length;
  let availableCells = 0;
  let applicableCells = 0;

  // Target locales excluding global_en
  const targetLocales = locales.filter((l) => l.id !== 'global_en');
  const languageCount = targetLocales.length > 0 ? targetLocales.length : locales.length;

  const availableVariantUrls = new Set<string>();
  let totalSizeKb = 0;

  for (const row of rows) {
    for (const locale of locales) {
      const cell = row.cells[locale.id];
      if (!cell || cell.status === 'not_applicable') continue;

      applicableCells++;
      if (cell.status === 'audio' || cell.status === 'subtitled') {
        availableCells++;
        if (cell.variant?.supabase_url && !availableVariantUrls.has(cell.variant.supabase_url)) {
          availableVariantUrls.add(cell.variant.supabase_url);
          totalSizeKb += cell.variant.size_kb || 0;
        }
      }
    }
  }

  const coveragePercent = applicableCells > 0 ? Math.round((availableCells / applicableCells) * 100) : 0;

  return {
    totalVideos,
    targetVideos: applicableCells,
    availableVideos: availableCells,
    totalSizeMb: Math.round(totalSizeKb / 1000),
    localeCount: locales.length,
    languageCount,
    coveragePercent,
  };
}

/**
 * Calculates translation coverage for a single column (locale), excluding N/A.
 */
export function getColumnCoverage(
  rows: IFarmerVideoMatrixRow[],
  localeId: string,
): { available: number; applicable: number; percent: number } {
  let available = 0;
  let applicable = 0;

  for (const row of rows) {
    const cell = row.cells[localeId];
    if (!cell || cell.status === 'not_applicable') continue;

    applicable++;
    if (cell.status === 'audio' || cell.status === 'subtitled') {
      available++;
    }
  }

  const percent = applicable > 0 ? Math.round((available / applicable) * 100) : 0;
  return { available, applicable, percent };
}
