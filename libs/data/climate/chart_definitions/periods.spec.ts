import type { IMonthlyStationData, IStationCapabilities, IStationMeta } from '@picsa/models';
import {
  CLIMATE_CHART_DEFINITIONS,
  COUNTRY_ACTIVE_MONTHS,
  COUNTRY_THREE_MONTH_PERIODS,
  DEFAULT_ACTIVE_MONTHS,
  DEFAULT_THREE_MONTH_PERIODS,
  formatThreeMonthPeriodLabel,
  getActiveMonthsForCountry,
  getActivePeriodsForCountry,
  getChartDefinitionText,
} from './index';

describe('Climate 3-Month Periods & Chart Definition Models (Issue 13)', () => {
  describe('Active Months Configuration', () => {
    it('should default to October through June (excluding July, August, September)', () => {
      expect(DEFAULT_ACTIVE_MONTHS).toEqual([10, 11, 12, 1, 2, 3, 4, 5, 6]);
      expect(DEFAULT_ACTIVE_MONTHS).not.toContain(7);
      expect(DEFAULT_ACTIVE_MONTHS).not.toContain(8);
      expect(DEFAULT_ACTIVE_MONTHS).not.toContain(9);
    });

    it('should provide active month configs for Zambia, Malawi, Zimbabwe', () => {
      expect(getActiveMonthsForCountry('zm')).toEqual(DEFAULT_ACTIVE_MONTHS);
      expect(getActiveMonthsForCountry('mw')).toEqual(DEFAULT_ACTIVE_MONTHS);
      expect(getActiveMonthsForCountry('zw')).toEqual(DEFAULT_ACTIVE_MONTHS);
      expect(getActiveMonthsForCountry('unknown_country')).toEqual(DEFAULT_ACTIVE_MONTHS);
    });

    it('should resolve active 3-month periods for a country', () => {
      expect(getActivePeriodsForCountry('zm')).toEqual(COUNTRY_THREE_MONTH_PERIODS.zm);
      expect(getActivePeriodsForCountry(undefined)).toEqual(DEFAULT_THREE_MONTH_PERIODS);
    });
  });
  describe('Country 3-Month Periods', () => {
    it('should export standard 3-month periods with month indices and codes', () => {
      expect(DEFAULT_THREE_MONTH_PERIODS.length).toBe(5);

      const djf = DEFAULT_THREE_MONTH_PERIODS.find((s) => s.id === 'djf');
      expect(djf).toBeDefined();
      expect(djf?.code).toBe('DJF');
      expect(djf?.months).toEqual([12, 1, 2]);
      expect(djf?.primary).toBe(true);

      const ond = DEFAULT_THREE_MONTH_PERIODS.find((s) => s.id === 'ond');
      expect(ond).toBeDefined();
      expect(ond?.code).toBe('OND');
      expect(ond?.months).toEqual([10, 11, 12]);
    });

    it('should provide country-specific entries for Zambia (zm) and Malawi (mw)', () => {
      expect(COUNTRY_THREE_MONTH_PERIODS.zm).toBeDefined();
      expect(COUNTRY_THREE_MONTH_PERIODS.mw).toBeDefined();

      expect(COUNTRY_THREE_MONTH_PERIODS.zm.some((s) => s.id === 'djf')).toBe(true);
      expect(COUNTRY_THREE_MONTH_PERIODS.mw.some((s) => s.id === 'djf')).toBe(true);
    });

    it('should ensure all configured period months are valid 1-indexed month numbers (1-12)', () => {
      for (const [country, periods] of Object.entries(COUNTRY_THREE_MONTH_PERIODS)) {
        for (const period of periods) {
          expect(period.months.length).toBe(3);
          for (const m of period.months) {
            expect(m).toBeGreaterThanOrEqual(1);
            expect(m).toBeLessThanOrEqual(12);
          }
        }
      }
    });

    it('should format period labels dynamically using month names without hardcoding text in data', () => {
      const djf = DEFAULT_THREE_MONTH_PERIODS.find((s) => s.id === 'djf')!;

      // Default / fallback to English MONTH_DATA
      const defaultLabel = formatThreeMonthPeriodLabel(djf);
      expect(defaultLabel).toBe('Dec – Feb (DJF)');

      // With localized month array (e.g. French)
      const frenchMonths = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
      const frenchLabel = formatThreeMonthPeriodLabel(djf, frenchMonths);
      expect(frenchLabel).toBe('Déc – Févr (DJF)');
    });
  });

  describe('Chart Definition Descriptions & Timespan Resolution', () => {
    const rainfallDef = CLIMATE_CHART_DEFINITIONS.default.rainfall;

    it('should define monthly and 3-month sub-definitions for rainfall', () => {
      expect(rainfallDef.definitionMonthly).toBeDefined();
      expect(rainfallDef.definitionMonthly).toContain('selected month');
      expect(rainfallDef.definitionThreeMonth).toBeDefined();
      expect(rainfallDef.definitionThreeMonth).toContain('complete data');
    });

    it('should define monthly and 3-month sub-definitions for temperature charts', () => {
      const tempMaxDef = CLIMATE_CHART_DEFINITIONS.default.temp_max;
      const tempMinDef = CLIMATE_CHART_DEFINITIONS.default.temp_min;

      expect(tempMaxDef.definitionMonthly).toBeDefined();
      expect(tempMaxDef.definitionThreeMonth).toBeDefined();
      expect(tempMinDef.definitionMonthly).toBeDefined();
      expect(tempMinDef.definitionThreeMonth).toBeDefined();
    });

    it('should return appropriate definition text based on timespan mode via getChartDefinitionText', () => {
      expect(getChartDefinitionText(rainfallDef, 'annual')).toBe(rainfallDef.definition);
      expect(getChartDefinitionText(rainfallDef, 'monthly')).toBe(rainfallDef.definitionMonthly!);
      expect(getChartDefinitionText(rainfallDef, 'three_month')).toBe(rainfallDef.definitionThreeMonth!);
    });

    it('should fall back safely if sub-definition is not defined or chart is undefined', () => {
      const startDef = CLIMATE_CHART_DEFINITIONS.default.start;
      expect(getChartDefinitionText(startDef, 'monthly')).toBe(startDef.definition);
      expect(getChartDefinitionText(undefined, 'monthly')).toBe('');
    });
  });

  describe('Type Conformance', () => {
    it('should instantiate valid IMonthlyStationData and IStationCapabilities', () => {
      const monthlyRow: IMonthlyStationData = {
        month: '1944-07',
        Rainfall: 12.5,
        min_tmin: 15.6,
        mean_tmin: 18.0,
        mean_tmax: 26.1,
        max_tmax: 29.4,
      };

      expect(monthlyRow.month).toBe('1944-07');
      expect(monthlyRow.mean_tmax).toBe(26.1);

      const caps: IStationCapabilities = {
        schemaVersion: 1,
        lastUpdated: '2026-09-09T08:00:00Z',
        contentHash: 'abc123hash',
        years: [1944, 2024],
        annual: ['rainfall', 'temp_min', 'temp_max'],
        monthly: ['rainfall', 'temp_min', 'temp_max'],
      };

      const station: Partial<IStationMeta> = {
        id: 'chipata_met',
        capabilities: caps,
      };

      expect(station.capabilities?.contentHash).toBe('abc123hash');
      expect(station.capabilities?.years).toEqual([1944, 2024]);
      expect(station.capabilities?.annual).toContain('rainfall');
      expect(station.capabilities?.monthly).toContain('rainfall');
    });
  });
});
