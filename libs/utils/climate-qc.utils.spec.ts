import type { IStationData } from '@picsa/models';

import {
  CLIMATE_QC_GATES,
  calculateStationQcScore,
  detectSeasonDiscrepancies,
  evaluateStationQualityGates,
  formatSeasonDiscrepancySummary,
  hasValidRainfallObservation,
  hasValidSeasonBound,
  resolveStationDraftStatus,
} from './climate-qc.utils';

describe('climate-qc.utils', () => {
  const REF_YEAR = 2026;

  function createMockRow(year: number, rainfall?: number, start?: number, end?: number): IStationData {
    return {
      Year: year,
      Rainfall: rainfall as any,
      Start: start as any,
      End: end as any,
      Length: 100 as any,
      Extreme_events: 0 as any,
    };
  }

  describe('hasValidRainfallObservation', () => {
    it('should validate finite numeric rainfall values', () => {
      expect(hasValidRainfallObservation(createMockRow(2020, 500))).toBe(true);
      expect(hasValidRainfallObservation(createMockRow(2020, 0))).toBe(true);
      expect(hasValidRainfallObservation(createMockRow(2020, undefined))).toBe(false);
      expect(hasValidRainfallObservation(createMockRow(2020, Number.NaN))).toBe(false);
      expect(hasValidRainfallObservation(null)).toBe(false);
    });
  });

  describe('hasValidSeasonBound', () => {
    it('should validate non-zero numeric season DOY bounds', () => {
      expect(hasValidSeasonBound(300)).toBe(true);
      expect(hasValidSeasonBound(0)).toBe(false);
      expect(hasValidSeasonBound(undefined)).toBe(false);
      expect(hasValidSeasonBound(null)).toBe(false);
    });
  });

  describe('detectSeasonDiscrepancies', () => {
    it('should flag year with start but no end', () => {
      const rows = [createMockRow(2020, 500, 300, undefined)];
      const result = detectSeasonDiscrepancies(rows);
      expect(result.count).toBe(1);
      expect(result.discrepancies[0]).toEqual({ year: 2020, hasStart: true, hasEnd: false });
    });

    it('should flag year with end but no start', () => {
      const rows = [createMockRow(2020, 500, undefined, 100)];
      const result = detectSeasonDiscrepancies(rows);
      expect(result.count).toBe(1);
      expect(result.discrepancies[0]).toEqual({ year: 2020, hasStart: false, hasEnd: true });
    });

    it('should not flag year with both start and end present', () => {
      const rows = [createMockRow(2020, 500, 300, 100)];
      const result = detectSeasonDiscrepancies(rows);
      expect(result.count).toBe(0);
    });

    it('should not flag year with neither start nor end present', () => {
      const rows = [createMockRow(2020, 500, undefined, undefined)];
      const result = detectSeasonDiscrepancies(rows);
      expect(result.count).toBe(0);
    });
  });

  describe('calculateStationQcScore', () => {
    it('should return negative value equal to number of failures when failures exist', () => {
      expect(calculateStationQcScore(3, 0)).toBe(-3);
      expect(calculateStationQcScore(2, 25)).toBe(-2);
      expect(calculateStationQcScore(1, 28)).toBe(-1);
    });

    it('should return positive score equal to total rainfall years when all checks pass', () => {
      expect(calculateStationQcScore(0, 30)).toBe(30);
      expect(calculateStationQcScore(0, 45)).toBe(45);
      expect(calculateStationQcScore(0, 72)).toBe(72);
    });
  });

  describe('evaluateStationQualityGates', () => {
    it('should fail with -3 when 0 rainfall years exist', () => {
      const result = evaluateStationQualityGates([], { referenceYear: REF_YEAR });
      expect(result.passed).toBe(false);
      expect(result.qc_score).toBe(-3);
      expect(result.failures).toEqual(['insufficient_total_years', 'no_recent_data', 'sparse_recent_data']);
      expect(result.totalRainfallYears).toBe(0);
      expect(result.reasons.length).toBe(3);
    });

    it('should fail insufficient_total_years when total years < 30', () => {
      // 25 years with recent data
      const rows = Array.from({ length: 25 }, (_, i) => createMockRow(2000 + i, 600, 300, 100));
      const result = evaluateStationQualityGates(rows, { referenceYear: REF_YEAR });
      expect(result.passed).toBe(false);
      expect(result.qc_score).toBe(-1);
      expect(result.failures).toContain('insufficient_total_years');
      expect(result.totalRainfallYears).toBe(25);
      expect(result.reasons[0]).toContain('25/30 minimum required years');
    });

    it('should fail no_recent_data when 0 years exist in past 10 years', () => {
      // 30 years ending in 2015 (REF_YEAR is 2026, 10-year window is 2016..2026)
      const rows = Array.from({ length: 30 }, (_, i) => createMockRow(1986 + i, 600, 300, 100));
      const result = evaluateStationQualityGates(rows, { referenceYear: REF_YEAR });
      expect(result.passed).toBe(false);
      expect(result.failures).toContain('no_recent_data');
      expect(result.totalRainfallYears).toBe(30);
      expect(result.recentTenYearsCount).toBe(0);
      expect(result.reasons.some((r) => r.includes('No recent data in past 10 years'))).toBe(true);
    });

    it('should fail sparse_recent_data when < 10 years exist in past 30 years', () => {
      // 25 years in 1960..1984, plus 5 years in 2016..2020 = 30 total years, but only 5 in 1996..2026
      const rows = [
        ...Array.from({ length: 25 }, (_, i) => createMockRow(1960 + i, 600, 300, 100)),
        ...Array.from({ length: 5 }, (_, i) => createMockRow(2016 + i, 600, 300, 100)),
      ];
      const result = evaluateStationQualityGates(rows, { referenceYear: REF_YEAR });
      expect(result.passed).toBe(false);
      expect(result.failures).toContain('sparse_recent_data');
      expect(result.totalRainfallYears).toBe(30);
      expect(result.recentTenYearsCount).toBe(5);
      expect(result.recentThirtyYearsCount).toBe(5); // < 10
      expect(result.reasons.some((r) => r.includes('past 30 years'))).toBe(true);
    });

    it('should pass breaking QC with positive score but flag warning when season discrepancies exist', () => {
      // 35 continuous years (1990..2024), 1 year has Start but no End
      const rows = Array.from({ length: 35 }, (_, i) => {
        const year = 1990 + i;
        const end = year === 2022 ? undefined : 100;
        return createMockRow(year, 600, 300, end);
      });

      const result = evaluateStationQualityGates(rows, { referenceYear: REF_YEAR });
      expect(result.passed).toBe(true);
      expect(result.qc_score).toBe(35);
      expect(result.failures).toEqual([]);
      expect(result.warnings).toEqual(['season_start_no_end']);
      expect(result.warningReasons).toEqual(['1 year with start but no end']);
      expect(result.totalRainfallYears).toBe(35);
      expect(result.recentTenYearsCount).toBeGreaterThanOrEqual(1);
      expect(result.recentThirtyYearsCount).toBeGreaterThanOrEqual(10);
      expect(result.seasonDiscrepanciesCount).toBe(1);
      expect(result.seasonDiscrepancies[0].year).toBe(2022);
      expect(result.seasonDiscrepancySummary).toBe('1 year with start but no end');
    });

    it('should flag both start_no_end and end_no_start as separate warnings when both occur', () => {
      const rows = [
        ...Array.from({ length: 33 }, (_, i) => createMockRow(1990 + i, 600, 300, 100)),
        createMockRow(2023, 600, 300, undefined),
        createMockRow(2024, 600, undefined, 100),
      ];

      const result = evaluateStationQualityGates(rows, { referenceYear: REF_YEAR });
      expect(result.passed).toBe(true);
      expect(result.qc_score).toBe(35);
      expect(result.warnings).toEqual(['season_start_no_end', 'season_end_no_start']);
      expect(result.warningReasons).toEqual(['1 year with start but no end', '1 year with end but no start']);
    });

    it('should pass when all rainfall gates pass and 0 season discrepancies exist', () => {
      // 35 continuous years (1990..2024) with complete start and end bounds
      const rows = Array.from({ length: 35 }, (_, i) => createMockRow(1990 + i, 600, 300, 100));

      const result = evaluateStationQualityGates(rows, { referenceYear: REF_YEAR });
      expect(result.passed).toBe(true);
      expect(result.qc_score).toBe(35);
      expect(result.failures).toEqual([]);
      expect(result.warnings).toEqual([]);
      expect(result.totalRainfallYears).toBe(35);
      expect(result.seasonDiscrepanciesCount).toBe(0);
      expect(result.reasons).toEqual([]);
    });

    it('should respect custom QC gates', () => {
      const rows = Array.from({ length: 15 }, (_, i) => createMockRow(2010 + i, 600, 300, 100));
      const customGates = {
        ...CLIMATE_QC_GATES,
        minTotalRainfallYears: 10,
        minRecentTenYears: 1,
        minRecentThirtyYears: 5,
      };

      const result = evaluateStationQualityGates(rows, { referenceYear: REF_YEAR, gates: customGates });
      expect(result.passed).toBe(true);
      expect(result.qc_score).toBe(15);
      expect(result.failures).toEqual([]);
    });
  });

  describe('resolveStationDraftStatus', () => {
    it('should mark draft true when failures exist or unassessed', () => {
      expect(resolveStationDraftStatus(['insufficient_total_years'])).toBe(true);
      expect(resolveStationDraftStatus(undefined)).toBe(true);
    });

    it('should mark draft false when failures array is empty (passed QC)', () => {
      expect(resolveStationDraftStatus([])).toBe(false);
    });
  });
});
