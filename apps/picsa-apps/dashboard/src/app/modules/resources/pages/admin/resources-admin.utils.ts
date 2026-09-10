import {
  COUNTRIES_DATA_HASHMAP,
  ICountryCode,
  ILocaleCode,
  ILocaleDataEntry,
  LOCALES_DATA_HASHMAP,
} from '@picsa/data/deployments';
import { IPicsaVideo, IPicsaVideoData } from '@picsa/data/resources';
import { unparse } from 'papaparse';

export interface IFarmerVideoMatrixRow {
  id: string;
  stepNumber: number;
  title: string;
  children: IPicsaVideo[];
  variants: Record<string, IPicsaVideo | undefined>;
  totalVariants: number;
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
}

export interface IFarmerVideoStats {
  totalVideos: number;
  totalFiles: number;
  totalSizeMb: number;
  localeCount: number;
  languageCount: number;
  coveragePercent: number;
}

export interface ICountryFilterOption {
  code: string;
  label: string;
}

/**
 * Returns a human-friendly country label for any country code,
 * leveraging the central COUNTRIES_DATA_HASHMAP.
 */
export function getCountryLabel(countryCode: string): string {
  if (countryCode === 'all') return 'All Countries';
  const entry = COUNTRIES_DATA_HASHMAP[countryCode as ICountryCode];
  if (entry?.label) return entry.label;
  if (countryCode === 'tj') return 'Tajikistan';
  return countryCode.toUpperCase();
}

/**
 * Derives a human-readable comma-separated list of languages represented by a video variant.
 */
export function formatVariantLanguages(variant: IPicsaVideo): string {
  const names = variant.locale_codes.map((code) => {
    const meta = LOCALES_DATA_HASHMAP[code];
    return meta ? meta.language_label : code;
  });
  return names.join(', ');
}

/**
 * Derives country code and label for a video variant based on its locale codes.
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
 * Calculates summary metrics for the farmer videos and their language coverage.
 */
export function calculateFarmerVideoStats(videos: IPicsaVideoData[]): IFarmerVideoStats {
  const totalVideos = videos.length;
  let totalFiles = 0;
  let totalSizeKb = 0;
  const coveredLocales = new Set<string>();
  const coveredLanguages = new Set<string>();

  for (const video of videos) {
    totalFiles += video.children.length;
    for (const child of video.children) {
      totalSizeKb += child.size_kb || 0;
      for (const code of child.locale_codes) {
        coveredLocales.add(code);
        const meta = LOCALES_DATA_HASHMAP[code];
        if (meta) {
          coveredLanguages.add(meta.language_label);
        }
      }
    }
  }

  const totalPossibleCombinations = totalVideos * coveredLocales.size;
  const coveragePercent =
    totalPossibleCombinations > 0 ? Math.round((totalFiles / totalPossibleCombinations) * 100) : 0;

  return {
    totalVideos,
    totalFiles,
    totalSizeMb: Math.round(totalSizeKb / 1000),
    localeCount: coveredLocales.size,
    languageCount: coveredLanguages.size,
    coveragePercent,
  };
}

/**
 * Prepares the matrix rows with pre-indexed variants and optional search query filter.
 */
export function buildFarmerVideoMatrixRows(videos: IPicsaVideoData[], searchTerm = ''): IFarmerVideoMatrixRow[] {
  const search = searchTerm.trim().toLowerCase();

  return videos
    .map((video, index): IFarmerVideoMatrixRow => {
      const variants: Record<string, IPicsaVideo | undefined> = {};
      let totalSizeKb = 0;

      for (const child of video.children) {
        totalSizeKb += child.size_kb || 0;
        for (const code of child.locale_codes) {
          variants[code] = child;
        }
      }

      return {
        id: video.id,
        stepNumber: index + 1,
        title: video.title || video.id,
        children: video.children,
        variants,
        totalVariants: video.children.length,
        totalSizeKb,
      };
    })
    .filter((row) => {
      if (!search) return true;
      return row.title.toLowerCase().includes(search) || row.id.toLowerCase().includes(search);
    });
}

/**
 * Filters the list of available locales based on selected country and active video presence.
 */
export function filterLocales(
  allLocales: ILocaleDataEntry[],
  country: string,
  onlyWithVideos: boolean,
  activeLocaleCodes: Set<string>,
): ILocaleDataEntry[] {
  return allLocales.filter((locale) => {
    if (country !== 'all' && locale.country_code !== country) {
      return false;
    }
    if (onlyWithVideos && !activeLocaleCodes.has(locale.id)) {
      return false;
    }
    return true;
  });
}

/**
 * Calculates the number and percentage of videos translated for a specific locale.
 */
export function getLocaleCoverage(videos: IPicsaVideoData[], localeCode: string): { count: number; percent: number } {
  let count = 0;
  for (const video of videos) {
    const hasVariant = video.children.some((child) => child.locale_codes.includes(localeCode as ILocaleCode));
    if (hasVariant) count++;
  }
  const total = videos.length;
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return { count, percent };
}

/**
 * Generates an RFC-compliant CSV string for the farmer video translation matrix.
 */
export function generateMatrixCSV(rows: IFarmerVideoMatrixRow[], locales: ILocaleDataEntry[]): string {
  const data = rows.map((row) => {
    const entry: Record<string, string | number> = {
      Step: row.stepNumber,
      'Video Title': row.title,
      'Video ID': row.id,
      'Available Translations': row.totalVariants,
    };

    for (const locale of locales) {
      const variant = row.variants[locale.id];
      const colHeader = `${locale.language_label} (${getCountryLabel(locale.country_code)})`;
      if (variant) {
        const mb = Math.round(variant.size_kb / 100) / 10;
        entry[colHeader] = `Available (${variant.resolution}, ${mb}MB)`;
      } else {
        entry[colHeader] = 'Missing';
      }
    }

    return entry;
  });

  return unparse(data);
}
