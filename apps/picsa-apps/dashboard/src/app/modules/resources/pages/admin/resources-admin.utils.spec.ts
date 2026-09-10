import { LOCALES_DATA } from '@picsa/data/deployments';
import { PICSA_FARMER_VIDEOS_DATA } from '@picsa/data/resources';

import {
  buildFarmerVideoMatrixRows,
  calculateFarmerVideoStats,
  filterLocales,
  formatVariantCountry,
  formatVariantLanguages,
  generateMatrixCSV,
  getCountryLabel,
  getLocaleCoverage,
} from './resources-admin.utils';

describe('resources-admin.utils', () => {
  describe('getCountryLabel', () => {
    it('should return All Countries for "all"', () => {
      expect(getCountryLabel('all')).toBe('All Countries');
    });

    it('should return correct country names for known codes', () => {
      expect(getCountryLabel('global')).toBe('Global');
      expect(getCountryLabel('mw')).toBe('Malawi');
      expect(getCountryLabel('zm')).toBe('Zambia');
      expect(getCountryLabel('zw')).toBe('Zimbabwe');
      expect(getCountryLabel('tj')).toBe('Tajikistan');
    });

    it('should fallback to uppercase for unknown code', () => {
      expect(getCountryLabel('xx')).toBe('XX');
    });
  });

  describe('formatVariantCountry and formatVariantLanguages', () => {
    it('should correctly format global English variant without substring errors', () => {
      const ram = PICSA_FARMER_VIDEOS_DATA[0];
      const globalVariant = ram.children.find((c) => c.locale_codes.includes('global_en'));
      expect(globalVariant).toBeDefined();
      if (!globalVariant) return;

      const languages = formatVariantLanguages(globalVariant);
      expect(languages).toBe('English');

      const country = formatVariantCountry(globalVariant);
      expect(country.code).toBe('global');
      expect(country.label).toBe('Global');
    });

    it('should correctly format local language variants', () => {
      const ram = PICSA_FARMER_VIDEOS_DATA[0];
      const mwNyVariant = ram.children.find((c) => c.locale_codes.includes('mw_ny'));
      expect(mwNyVariant).toBeDefined();
      if (!mwNyVariant) return;

      const languages = formatVariantLanguages(mwNyVariant);
      expect(languages).toBe('Chichewa');

      const country = formatVariantCountry(mwNyVariant);
      expect(country.code).toBe('mw');
      expect(country.label).toBe('Malawi');
    });
  });

  describe('calculateFarmerVideoStats', () => {
    it('should aggregate statistics for PICSA farmer videos', () => {
      const stats = calculateFarmerVideoStats(PICSA_FARMER_VIDEOS_DATA);
      expect(stats.totalVideos).toBe(8);
      expect(stats.totalFiles).toBeGreaterThanOrEqual(80);
      expect(stats.localeCount).toBe(12);
      expect(stats.languageCount).toBe(10);
      expect(stats.totalSizeMb).toBeGreaterThan(100);
      expect(stats.coveragePercent).toBeGreaterThan(0);
    });
  });

  describe('buildFarmerVideoMatrixRows', () => {
    it('should construct matrix rows and map variants indexed by locale', () => {
      const rows = buildFarmerVideoMatrixRows(PICSA_FARMER_VIDEOS_DATA);
      expect(rows.length).toBe(8);
      const first = rows[0];
      expect(first.id).toBe('ram');
      expect(first.stepNumber).toBe(1);
      expect(first.variants['global_en']).toBeDefined();
      expect(first.variants['mw_ny']).toBeDefined();
      expect(first.variants['zm_bem']).toBeDefined();
    });

    it('should filter rows by search query matching title or id', () => {
      const filteredByTitle = buildFarmerVideoMatrixRows(PICSA_FARMER_VIDEOS_DATA, 'Risk');
      expect(filteredByTitle.length).toBe(1);
      expect(filteredByTitle[0].id).toBe('probability_risk');

      const filteredById = buildFarmerVideoMatrixRows(PICSA_FARMER_VIDEOS_DATA, 'short_term');
      expect(filteredById.length).toBe(1);
      expect(filteredById[0].id).toBe('short_term_forecast');
    });
  });

  describe('filterLocales', () => {
    const activeCodes = new Set(['global_en', 'mw_ny', 'zm_bem']);

    it('should filter by country code', () => {
      const mwLocales = filterLocales(LOCALES_DATA, 'mw', false, activeCodes);
      expect(mwLocales.every((l) => l.country_code === 'mw')).toBe(true);
    });

    it('should filter only active locales when onlyWithVideos is true', () => {
      const filtered = filterLocales(LOCALES_DATA, 'all', true, activeCodes);
      expect(filtered.length).toBe(3);
      expect(filtered.map((l) => l.id)).toEqual(expect.arrayContaining(['global_en', 'mw_ny', 'zm_bem']));
    });
  });

  describe('getLocaleCoverage', () => {
    it('should calculate correct coverage count and percent', () => {
      const mwNyCoverage = getLocaleCoverage(PICSA_FARMER_VIDEOS_DATA, 'mw_ny');
      expect(mwNyCoverage.count).toBe(8);
      expect(mwNyCoverage.percent).toBe(100);

      const tjCoverage = getLocaleCoverage(PICSA_FARMER_VIDEOS_DATA, 'tj_tg');
      expect(tjCoverage.count).toBe(0);
      expect(tjCoverage.percent).toBe(0);
    });
  });

  describe('generateMatrixCSV', () => {
    it('should output CSV string with expected columns and rows', () => {
      const rows = buildFarmerVideoMatrixRows(PICSA_FARMER_VIDEOS_DATA);
      const mwLocales = LOCALES_DATA.filter((l) => l.country_code === 'mw');
      const csv = generateMatrixCSV(rows, mwLocales);

      expect(typeof csv).toBe('string');
      expect(csv).toContain('Step,Video Title,Video ID,Available Translations');
      expect(csv).toContain('Resource Allocation Map');
      expect(csv).toContain('Available');
    });
  });
});
