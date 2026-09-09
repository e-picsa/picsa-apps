import type { IIncomingClimateRecord, IMonthlyStationData, IStationData } from '@picsa/models';
import {
  auditMonthlyChanges,
  calculateStationCapabilities,
  formatMonthlyCsv,
  generateMarkdownAuditReport,
  normalizeMonthKey,
  parseAnnualCsv,
  parseMonthlyCsv,
  pivotLongToWideMonthly,
  roundClimateValue,
  stationHasTemperatureData,
} from '@picsa/utils';

describe('Climate Data Sync & Transformation Pipeline', () => {
  describe('roundClimateValue & normalizeMonthKey', () => {
    it('should round numbers to 1 decimal place', () => {
      expect(roundClimateValue(12.349)).toBe(12.3);
      expect(roundClimateValue(12.351)).toBe(12.4);
      expect(roundClimateValue(0)).toBe(0);
      expect(roundClimateValue(null)).toBeNull();
      expect(roundClimateValue(undefined)).toBeNull();
      expect(roundClimateValue(NaN)).toBeNull();
    });

    it('should normalize months into YYYY-MM format', () => {
      expect(normalizeMonthKey('1950-7')).toBe('1950-07');
      expect(normalizeMonthKey('1950-07')).toBe('1950-07');
      expect(normalizeMonthKey('1950/7')).toBe('1950-07');
      expect(normalizeMonthKey('1950-12-01T00:00:00Z')).toBe('1950-12');
    });
  });

  describe('parseAnnualCsv', () => {
    it('should parse standard comma-delimited annual CSV', () => {
      const csv = `Year,Start,End,Length,Rainfall,min_tmin,mean_tmin,mean_tmax,max_tmax
1944,,,,,,,,
1945,135,301,166,1187,6.4,16.1,27.5,36.6`;
      const rows = parseAnnualCsv(csv);
      expect(rows).toHaveLength(2);
      expect(rows[0].Year).toBe(1944);
      expect(rows[0].Rainfall).toBeNull();
      expect(rows[1].Year).toBe(1945);
      expect(rows[1].Rainfall).toBe(1187);
      expect(rows[1].min_tmin).toBe(6.4);
    });

    it('should parse tab-delimited annual TSV and treat all-zero season rows as missing', () => {
      const tsv = `Year\tStart\tEnd\tLength\tRainfall
1963\t0\t0\t0\t0
1964\t151\t251\t100\t389`;
      const rows = parseAnnualCsv(tsv);
      expect(rows).toHaveLength(2);
      expect(rows[0].Year).toBe(1963);
      expect(rows[0].Rainfall).toBeNull();
      expect(rows[0].Start).toBeNull();
      expect(rows[1].Year).toBe(1964);
      expect(rows[1].Rainfall).toBe(389);
      expect(rows[1].Start).toBe(151);
    });
  });

  describe('pivotLongToWideMonthly', () => {
    it('should pivot long records into wide monthly station rows with 1-decimal rounding', () => {
      const records: IIncomingClimateRecord[] = [
        {
          station_id: 'chipata_met',
          time_value: '1944-07',
          summary_element: 'rainfall',
          summary_value: 0.04,
        },
        {
          station_id: 'chipata_met',
          time_value: '1944-07',
          summary_element: 'mean_tmin',
          summary_value: 18.01,
        },
        {
          station_id: 'chipata_met',
          time_value: '1944-07',
          summary_element: 'mean_tmax',
          summary_value: 26.14,
        },
        {
          station_id: 'chipata_met',
          time_value: '1944-08',
          summary_element: 'rainfall',
          summary_value: 12.56,
        },
      ];

      const rows = pivotLongToWideMonthly(records);
      expect(rows).toHaveLength(2);
      expect(rows[0].month).toBe('1944-07');
      expect(rows[0].Rainfall).toBe(0);
      expect(rows[0].mean_tmin).toBe(18.0);
      expect(rows[0].mean_tmax).toBe(26.1);
      expect(rows[1].month).toBe('1944-08');
      expect(rows[1].Rainfall).toBe(12.6);
    });
  });

  describe('formatMonthlyCsv & parseMonthlyCsv', () => {
    it('should format rain-only stations without temperature columns', () => {
      const data: IMonthlyStationData[] = [
        { month: '1950-01', Rainfall: 100.5 },
        { month: '1950-02', Rainfall: null },
      ];

      const csv = formatMonthlyCsv(data);
      expect(csv).toBe('month,Rainfall\n1950-01,100.5\n1950-02,\n');

      const parsed = parseMonthlyCsv(csv);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].Rainfall).toBe(100.5);
      expect(parsed[1].Rainfall).toBeNull();
      expect(parsed[0].mean_tmin).toBeUndefined();
    });

    it('should format stations with temperature with full 6 columns and empty cells for nulls', () => {
      const data: IMonthlyStationData[] = [{ month: '1950-01', Rainfall: 100.5, mean_tmin: 18.2, mean_tmax: 28.5 }];

      const csv = formatMonthlyCsv(data);
      expect(csv).toContain('month,Rainfall,min_tmin,mean_tmin,mean_tmax,max_tmax');
      expect(csv).toContain('1950-01,100.5,,18.2,28.5,');

      const parsed = parseMonthlyCsv(csv);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].Rainfall).toBe(100.5);
      expect(parsed[0].mean_tmin).toBe(18.2);
      expect(parsed[0].min_tmin).toBeNull();
    });
  });

  describe('calculateStationCapabilities', () => {
    it('should determine years, annual charts, and monthly availability flags', () => {
      const annualData: IStationData[] = [
        {
          Year: 1946,
          Start: 135,
          End: 301,
          Length: 166,
          Rainfall: 1187,
          Extreme_events: 5,
          mean_tmin: 16.1,
          mean_tmax: 27.5,
        },
        {
          Year: 1952,
          Start: 182,
          End: 278,
          Length: 96,
          Rainfall: 748,
          Extreme_events: 2,
          mean_tmin: 15.8,
          mean_tmax: 26.6,
        },
      ];

      const monthlyData: IMonthlyStationData[] = [
        { month: '1950-07', Rainfall: 0, mean_tmin: 11.2, mean_tmax: 26.5 },
        { month: '1952-06', Rainfall: 1.2, mean_tmin: 10.9, mean_tmax: 26.1 },
      ];

      const caps = calculateStationCapabilities({
        annualData,
        monthlyData,
        contentHash: 'mock-hash-123',
      });

      expect(caps.schemaVersion).toBe(1);
      expect(caps.contentHash).toBe('mock-hash-123');
      expect(caps.years).toEqual([1946, 1952]);
      expect(caps.annual).toContain('rainfall');
      expect(caps.annual).toContain('start');
      expect(caps.annual).toContain('end');
      expect(caps.annual).toContain('length');
      expect(caps.annual).toContain('extreme_rainfall_days');
      expect(caps.annual).toContain('temp_min');
      expect(caps.annual).toContain('temp_max');
      expect(caps.monthly).toEqual(['rainfall', 'temp_min', 'temp_max']);
      // 1946 to 1952 is 7 years; valid years are 1946, 1950, 1952 (3 years). 7 - 3 = 4 missing years.
      expect(caps.totalMissingYears).toBe(4);
    });

    it('should handle rain-only station capabilities correctly', () => {
      const annualData: IStationData[] = [
        {
          Year: 1960,
          Start: 140,
          End: 290,
          Length: 150,
          Rainfall: 800,
          Extreme_events: 1,
        },
      ];
      const monthlyData: IMonthlyStationData[] = [{ month: '1960-07', Rainfall: 0 }];

      const caps = calculateStationCapabilities({
        annualData,
        monthlyData,
      });

      expect(caps.annual).not.toContain('temp_min');
      expect(caps.annual).not.toContain('temp_max');
      expect(caps.monthly).toEqual(['rainfall']);
      expect(caps.totalMissingYears).toBe(0);
    });
  });

  describe('auditMonthlyChanges', () => {
    it('should detect historical revisions when values change by more than 0.05', () => {
      const existing: IMonthlyStationData[] = [{ month: '1950-10', Rainfall: 14.8, mean_tmin: 19.8 }];
      const incoming: IMonthlyStationData[] = [
        { month: '1950-10', Rainfall: 20.0, mean_tmin: 19.82 }, // Rainfall changed, temp minor float noise
      ];

      const diff = auditMonthlyChanges({
        stationId: 'chipata_met',
        existingData: existing,
        incomingData: incoming,
      });

      expect(diff.revisions.length).toBe(1);
      expect(diff.revisions[0].metric).toBe('Rainfall');
      expect(diff.revisions[0].oldValue).toBe(14.8);
      expect(diff.revisions[0].newValue).toBe(20.0);
      expect(diff.revisions[0].diff).toBe(5.2);
    });

    it('should detect missingness regressions when valid observation becomes null', () => {
      const existing: IMonthlyStationData[] = [{ month: '1950-10', Rainfall: 14.8 }];
      const incoming: IMonthlyStationData[] = [{ month: '1950-10', Rainfall: null }];

      const diff = auditMonthlyChanges({
        stationId: 'chipata_met',
        existingData: existing,
        incomingData: incoming,
      });

      expect(diff.regressions.length).toBe(1);
      expect(diff.regressions[0].metric).toBe('Rainfall');
      expect(diff.regressions[0].previousValue).toBe(14.8);
    });

    it('should detect physical sanity violations (temperature inversion and negative rainfall)', () => {
      const incoming: IMonthlyStationData[] = [
        {
          month: '1950-07',
          Rainfall: -2.5, // Negative rainfall
          min_tmin: 25.0, // Min exceeds mean
          mean_tmin: 20.0,
          mean_tmax: 18.0, // Mean tmin exceeds mean tmax
          max_tmax: 22.0,
        },
        {
          month: '1950-13', // Invalid month index
          Rainfall: 1600, // Outlier
        },
      ];

      const diff = auditMonthlyChanges({
        stationId: 'test_station',
        existingData: [],
        incomingData: incoming,
      });

      const rules = diff.sanityViolations.map((v) => v.rule);
      expect(rules).toContain('RAINFALL_NON_NEGATIVE');
      expect(rules).toContain('TEMP_MIN_EXCEEDS_MEAN');
      expect(rules).toContain('TEMP_INVERSION_TMIN_TMAX');
      expect(rules).toContain('CALENDAR_MONTH_RANGE');
      expect(rules).toContain('RAINFALL_EXTREME_OUTLIER');
    });
  });

  describe('generateMarkdownAuditReport', () => {
    it('should format a clean markdown audit report', () => {
      const report = generateMarkdownAuditReport({
        timestamp: '2026-09-09T12:00:00Z',
        totalStationsProcessed: 1,
        stationsSummary: [
          {
            id: 'chipata_met',
            status: 'UPDATED',
            years: [1946, 2024],
            hasRainfall: true,
            hasTemperature: true,
            hash: 'abcdef1234567890',
          },
        ],
        historicalRevisions: [
          {
            stationId: 'chipata_met',
            month: '1950-10',
            metric: 'Rainfall',
            oldValue: 14.8,
            newValue: 20.0,
            diff: 5.2,
          },
        ],
        missingnessRegressions: [],
        sanityViolations: [],
      });

      expect(report).toContain('# Climate Data Sync & Health Audit Report');
      expect(report).toContain('**chipata_met**');
      expect(report).toContain('1946–2024');
      expect(report).toContain('Historical Revisions (1)');
      expect(report).toContain('+5.2');
    });
  });
});
