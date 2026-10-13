import type { IStationData } from '@picsa/models';

import {
  CLIMATE_QC_GATES,
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
      expect(hasValidSeasonBound(Number.NaN)).toBe(false);
    });
  });

  describe('detectSeasonDiscrepancies', () => {
    it('should identify seasons having start but missing end and vice versa', () => {
      const rows: IStationData[] = [
        createMockRow(2000, 500, 300, 100), // paired
        createMockRow(2001, 600, 310, undefined), // start only
        createMockRow(2002, 700, undefined, 95), // end only
        createMockRow(2003, 800, undefined, undefined), // neither (no discrepancy)
      ];

      const result = detectSeasonDiscrepancies(rows);
      expect(result.count).toBe(2);
      expect(result.discrepancies).toEqual([
        { year: 2001, hasStart: true, hasEnd: false },
        { year: 2002, hasStart: false, hasEnd: true },
      ]);
    });
  });

  describe('formatSeasonDiscrepancySummary', () => {
    it('should format counts for start without end and end without start', () => {
      const summary = formatSeasonDiscrepancySummary([
        { year: 2001, hasStart: true, hasEnd: false },
        { year: 2002, hasStart: true, hasEnd: false },
        { year: 2003, hasStart: false, hasEnd: true },
      ]);
      expect(summary).toBe('2 years with start but no end, 1 year with end but no start');
    });

    it('should return empty string for empty discrepancies', () => {
      expect(formatSeasonDiscrepancySummary([])).toBe('');
    });
  });

  describe('evaluateStationQualityGates', () => {
    it('should return failures for empty datasets', () => {
      const result = evaluateStationQualityGates([], { referenceYear: REF_YEAR });
      expect(result.passed).toBe(false);
      expect(result.failures).toContain('insufficient_total_years');
      expect(result.totalRainfallYears).toBe(0);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('should fail when total rainfall years < 30', () => {
      // 25 continuous years up to 2026
      const rows: IStationData[] = Array.from({ length: 25 }, (_, i) => createMockRow(2002 + i, 600, 300, 100));
      const result = evaluateStationQualityGates(rows, { referenceYear: REF_YEAR });
      expect(result.passed).toBe(false);
      expect(result.failures).toEqual(['insufficient_total_years']);
      expect(result.totalRainfallYears).toBe(25);
      expect(result.reasons[0]).toContain('25/30 minimum required years');
    });

    it('should fail when no rainfall data in past 10 years', () => {
      // 35 years between 1970 and 2005 (past 10 years from 2026 is 2016..2026 -> 0 years)
      const rows: IStationData[] = Array.from({ length: 35 }, (_, i) => createMockRow(1970 + i, 600, 300, 100));
      const result = evaluateStationQualityGates(rows, { referenceYear: REF_YEAR });
      expect(result.passed).toBe(false);
      expect(result.failures).toContain('no_recent_data');
      expect(result.totalRainfallYears).toBe(35);
      expect(result.recentTenYearsCount).toBe(0);
      expect(result.reasons.some((r) => r.includes('past 10 years'))).toBe(true);
    });

    it('should fail when past 30 years has fewer than 10 years', () => {
      // 30 years total: 25 from 1950 to 1974, plus 5 years between 1996 and 2026 (including 1 in past 10)
      const oldRows = Array.from({ length: 25 }, (_, i) => createMockRow(1950 + i, 600, 300, 100));
      const recentRows = [
        createMockRow(1998, 600, 300, 100),
        createMockRow(2000, 600, 300, 100),
        createMockRow(2005, 600, 300, 100),
        createMockRow(2010, 600, 300, 100),
        createMockRow(2020, 600, 300, 100), // in past 10
      ];
      const rows = [...oldRows, ...recentRows];

      const result = evaluateStationQualityGates(rows, { referenceYear: REF_YEAR });
      expect(result.passed).toBe(false);
      expect(result.failures).toContain('sparse_recent_data');
      expect(result.totalRainfallYears).toBe(30);
      expect(result.recentTenYearsCount).toBe(1);
      expect(result.recentThirtyYearsCount).toBe(5); // < 10
      expect(result.reasons.some((r) => r.includes('past 30 years'))).toBe(true);
    });

    it('should pass breaking QC but flag warning when season discrepancies exist', () => {
      // 35 continuous years (1990..2024), 1 year has Start but no End
      const rows = Array.from({ length: 35 }, (_, i) => {
        const year = 1990 + i;
        const end = year === 2022 ? undefined : 100;
        return createMockRow(year, 600, 300, end);
      });

      const result = evaluateStationQualityGates(rows, { referenceYear: REF_YEAR });
      expect(result.passed).toBe(true);
      expect(result.failures).toEqual([]);
      expect(result.warnings).toEqual(['season_discrepancies']);
      expect(result.totalRainfallYears).toBe(35);
      expect(result.recentTenYearsCount).toBeGreaterThanOrEqual(1);
      expect(result.recentThirtyYearsCount).toBeGreaterThanOrEqual(10);
      expect(result.seasonDiscrepanciesCount).toBe(1);
      expect(result.seasonDiscrepancies[0].year).toBe(2022);
      expect(result.seasonDiscrepancySummary).toBe('1 year with start but no end');
    });

    it('should pass when all rainfall gates pass and 0 season discrepancies exist', () => {
      // 35 continuous years (1990..2024) with complete start and end bounds
      const rows = Array.from({ length: 35 }, (_, i) => createMockRow(1990 + i, 600, 300, 100));

      const result = evaluateStationQualityGates(rows, { referenceYear: REF_YEAR });
      expect(result.passed).toBe(true);
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
