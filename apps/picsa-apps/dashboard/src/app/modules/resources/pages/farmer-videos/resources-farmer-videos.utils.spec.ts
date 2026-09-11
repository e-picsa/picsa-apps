import { LOCALES_DATA } from '@picsa/data/deployments';
import { IPicsaVideo } from '@picsa/data/resources';

import {
  buildMatrixRows,
  calculateStats,
  evaluateTranslationCell,
  formatVariantCountry,
  formatVariantLanguages,
  generateMatrixCSV,
  getColumnCoverage,
  getCountryLabel,
  getDirectToFarmerVideos,
  getLocalesForCountry,
  getVideosForCountry,
  IFarmerVideoConfig,
  isLocaleApplicable,
} from './resources-farmer-videos.utils';

describe('resources-farmer-videos.utils', () => {
  const allVideos = getDirectToFarmerVideos();

  function getVideo(id: string): IFarmerVideoConfig {
    const found = allVideos.find((v) => v.id === id);
    if (!found) throw new Error(`Video with id ${id} not found`);
    return found;
  }

  function getVariant(video: IFarmerVideoConfig, localeCode: string): IPicsaVideo {
    const found = video.children.find((c) => c.locale_codes.includes(localeCode as never));
    if (!found) throw new Error(`Variant for locale ${localeCode} not found in ${video.id}`);
    return found;
  }

  describe('getDirectToFarmerVideos', () => {
    it('should include intro, 8 steps, and 4 testimonials', () => {
      expect(allVideos.length).toBe(1 + 8 + 4);
      expect(allVideos[0].category).toBe('intro');
      expect(allVideos[0].id).toBe('intro');

      const step1 = allVideos.find((v) => v.id === 'ram');
      expect(step1?.stepNumber).toBe(1);
      expect(step1?.useLocalizedEn).toBeUndefined();

      const step7 = allVideos.find((v) => v.id === 'seasonal_forecast');
      expect(step7?.stepNumber).toBe(7);
      expect(step7?.useLocalizedEn).toBe(true);

      const step8 = allVideos.find((v) => v.id === 'short_term_forecast');
      expect(step8?.stepNumber).toBe(8);
      expect(step8?.useLocalizedEn).toBe(true);

      const testimonials = allVideos.filter((v) => v.category === 'testimonial');
      expect(testimonials.length).toBe(4);
      expect(testimonials.map((t) => t.id)).toEqual([
        'jackline_nkhoma',
        'dani_chambwe',
        'john_tembo',
        'victoria_ngombe',
      ]);
      expect(testimonials.every((t) => t.useLocalizedEn === true)).toBe(true);
    });
  });

  describe('getVideosForCountry', () => {
    it('should filter testimonials by country code for Malawi', () => {
      const mwVideos = getVideosForCountry(allVideos, 'mw');
      expect(mwVideos.length).toBe(1 + 8 + 2); // intro + 8 steps + 2 MW testimonials
      expect(mwVideos.some((v) => v.id === 'jackline_nkhoma')).toBe(true);
      expect(mwVideos.some((v) => v.id === 'john_tembo')).toBe(false);
    });

    it('should filter testimonials by country code for Zambia', () => {
      const zmVideos = getVideosForCountry(allVideos, 'zm');
      expect(zmVideos.length).toBe(1 + 8 + 2); // intro + 8 steps + 2 ZM testimonials
      expect(zmVideos.some((v) => v.id === 'john_tembo')).toBe(true);
      expect(zmVideos.some((v) => v.id === 'jackline_nkhoma')).toBe(false);
    });

    it('should return all videos for global', () => {
      const globalVideos = getVideosForCountry(allVideos, 'global');
      expect(globalVideos.length).toBe(13);
    });
  });

  describe('getLocalesForCountry', () => {
    it('should return global_en and mw locales for Malawi', () => {
      const mwLocales = getLocalesForCountry(LOCALES_DATA, 'mw');
      expect(mwLocales.map((l) => l.id)).toEqual(expect.arrayContaining(['global_en', 'mw_en', 'mw_ny', 'mw_tum']));
      expect(mwLocales.some((l) => l.country_code === 'zm')).toBe(false);
    });

    it('should return global_en and zw locales for Zimbabwe', () => {
      const zwLocales = getLocalesForCountry(LOCALES_DATA, 'zw');
      expect(zwLocales.map((l) => l.id)).toEqual(expect.arrayContaining(['global_en', 'zw_en', 'zw_sn', 'zw_nd']));
    });
  });

  describe('isLocaleApplicable and English expectations', () => {
    const step1 = getVideo('ram');
    const step7 = getVideo('seasonal_forecast');
    const jackline = getVideo('jackline_nkhoma');

    it('should treat global_en as applicable and localized English as N/A when useLocalizedEn is omitted', () => {
      expect(isLocaleApplicable(step1, 'global_en')).toBe(true);
      expect(isLocaleApplicable(step1, 'mw_en')).toBe(false);
      expect(isLocaleApplicable(step1, 'zm_en')).toBe(false);
      expect(isLocaleApplicable(step1, 'mw_ny')).toBe(true);
    });

    it('should treat localized English as applicable and global_en as N/A when useLocalizedEn is true', () => {
      expect(isLocaleApplicable(step7, 'global_en')).toBe(false);
      expect(isLocaleApplicable(step7, 'mw_en')).toBe(true);
      expect(isLocaleApplicable(step7, 'zm_en')).toBe(true);
      expect(isLocaleApplicable(step7, 'mw_ny')).toBe(true);
    });

    it('should scope testimonials to their respective country locales', () => {
      expect(isLocaleApplicable(jackline, 'mw_en')).toBe(true);
      expect(isLocaleApplicable(jackline, 'mw_ny')).toBe(true);
      expect(isLocaleApplicable(jackline, 'global_en')).toBe(false);
      expect(isLocaleApplicable(jackline, 'zm_en')).toBe(false);
      expect(isLocaleApplicable(jackline, 'zm_ny')).toBe(false);
    });
  });

  describe('evaluateTranslationCell and subtitle detection', () => {
    it('should mark N/A for localized English on Step 1', () => {
      const step1 = getVideo('ram');
      const cell = evaluateTranslationCell(step1, 'mw_en');
      expect(cell.status).toBe('not_applicable');
    });

    it('should mark audio for primary language on Step 1', () => {
      const step1 = getVideo('ram');
      const cell = evaluateTranslationCell(step1, 'global_en');
      expect(cell.status).toBe('audio');
      expect(cell.isSubtitled).toBe(false);
    });

    it('should mark subtitled for English subtitles on testimonials', () => {
      const jackline = getVideo('jackline_nkhoma');
      // Jackline has locale_codes: ['mw_ny', 'mw_en']
      const cell = evaluateTranslationCell(jackline, 'mw_en');
      expect(cell.status).toBe('subtitled');
      expect(cell.isSubtitled).toBe(true);
      expect(cell.variant?.supabase_url).toContain('Jackline');
    });

    it('should mark subtitled for English subtitles on Zambia testimonials', () => {
      const john = getVideo('john_tembo');
      // John Tembo has locale_codes: ['zm_ny', 'zm_en']
      const cell = evaluateTranslationCell(john, 'zm_en');
      expect(cell.status).toBe('subtitled');
      expect(cell.isSubtitled).toBe(true);
      expect(cell.variant?.supabase_url).toContain('John%20Tembo');
    });

    it('should detect subtitles when video has multiple locales and secondary matches English', () => {
      const intro = getVideo('intro');
      // Intro MW child has locale_codes: ['mw_ny', 'global_en']
      const cell = evaluateTranslationCell(intro, 'global_en');
      expect(cell.status).toBe('subtitled');
      expect(cell.isSubtitled).toBe(true);
    });
  });

  describe('buildMatrixRows and getColumnCoverage', () => {
    const mwLocales = getLocalesForCountry(LOCALES_DATA, 'mw');
    const mwVideos = getVideosForCountry(allVideos, 'mw');

    it('should build matrix rows without errors', () => {
      const rows = buildMatrixRows(mwVideos, mwLocales);
      expect(rows.length).toBe(11);

      const ramRow = rows.find((r) => r.id === 'ram');
      expect(ramRow).toBeDefined();
      expect(ramRow?.cells['global_en'].status).toBe('audio');
      expect(ramRow?.cells['mw_en'].status).toBe('not_applicable');
      expect(ramRow?.cells['mw_ny'].status).toBe('audio');

      const jacklineRow = rows.find((r) => r.id === 'jackline_nkhoma');
      expect(jacklineRow).toBeDefined();
      expect(jacklineRow?.cells['global_en'].status).toBe('not_applicable');
      expect(jacklineRow?.cells['mw_en'].status).toBe('subtitled');
      expect(jacklineRow?.cells['mw_ny'].status).toBe('audio');
      expect(jacklineRow?.cells['mw_tum'].status).toBe('audio');
      expect(jacklineRow?.availableCount).toBe(3);
      expect(jacklineRow?.applicableCount).toBe(3);
    });

    it('should compute column coverage excluding N/A cells', () => {
      const rows = buildMatrixRows(mwVideos, mwLocales);
      const globalEnCoverage = getColumnCoverage(rows, 'global_en');
      // Step 7, 8, and 2 MW testimonials have global_en as N/A: 11 - 4 = 7
      expect(globalEnCoverage.applicable).toBe(7);
      expect(globalEnCoverage.available).toBe(7);

      const mwEnCoverage = getColumnCoverage(rows, 'mw_en');
      // Step 7, 8, and 2 MW testimonials have mw_en as applicable: 4
      expect(mwEnCoverage.applicable).toBe(4);
      expect(mwEnCoverage.available).toBe(4);
    });

    it('should filter rows by search term', () => {
      const rows = buildMatrixRows(mwVideos, mwLocales, 'calendar');
      expect(rows.length).toBe(1);
      expect(rows[0].id).toBe('seasonal_calendar');
    });
  });

  describe('calculateStats', () => {
    it('should compute overall statistics with 100% coverage for Malawi', () => {
      const mwLocales = getLocalesForCountry(LOCALES_DATA, 'mw');
      const mwVideos = getVideosForCountry(allVideos, 'mw');
      const rows = buildMatrixRows(mwVideos, mwLocales);
      const stats = calculateStats(rows, mwLocales);

      expect(stats.totalVideos).toBe(11);
      expect(stats.totalFiles).toBeGreaterThan(20);
      expect(stats.localeCount).toBe(4);
      expect(stats.coveragePercent).toBe(100);
    });
  });

  describe('generateMatrixCSV', () => {
    it('should generate CSV with N/A markers and categories', () => {
      const mwLocales = getLocalesForCountry(LOCALES_DATA, 'mw');
      const mwVideos = getVideosForCountry(allVideos, 'mw');
      const rows = buildMatrixRows(mwVideos, mwLocales);
      const csv = generateMatrixCSV(rows, mwLocales);

      expect(csv).toContain('Category,Video Title,Video ID,Available / Applicable');
      expect(csv).toContain('N/A');
      expect(csv).toContain('Available (English Subtitles');
    });
  });

  describe('formatVariantCountry and formatVariantLanguages', () => {
    it('should format variant labels', () => {
      const ram = getVideo('ram');
      const mwNyVariant = getVariant(ram, 'mw_ny');

      const country = formatVariantCountry(mwNyVariant);
      expect(country.code).toBe('mw');
      expect(country.label).toBe('Malawi');

      const languages = formatVariantLanguages(mwNyVariant);
      expect(languages).toBe('Chichewa');
    });
  });

  describe('getCountryLabel', () => {
    it('should map countries correctly', () => {
      expect(getCountryLabel('global')).toBe('Global');
      expect(getCountryLabel('mw')).toBe('Malawi');
      expect(getCountryLabel('zm')).toBe('Zambia');
      expect(getCountryLabel('zw')).toBe('Zimbabwe');
      expect(getCountryLabel('all')).toBe('Global');
    });
  });
});
