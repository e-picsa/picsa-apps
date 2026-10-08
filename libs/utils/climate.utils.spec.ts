import type { IIncomingClimateRecord, IMonthlyStationData, IStationData } from '@picsa/models';
import {
  auditMonthlyChanges,
  calculateStationCapabilities,
  aggregateThreeMonthSeries,
  convertMonthlyTemperatureSummariesToRows,
  convertMonthlyToStationData,
  convertStationSummariesToRows,
  filterMonthlyDataByMonth,
  formatAnnualCsv,
  formatMonthlyCsv,
  generateMarkdownAuditReport,
  mergeStationAnnualData,
  mergeStationMonthlyData,
  normalizeMonthKey,
  parseAnnualCsv,
  parseMonthlyCsv,
  pivotLongToWideMonthly,
  resolveClimateApiActions,
  resolveClimateProducts,
  roundClimateValue,
  stationHasAnnualTemperature,
  stationHasTemperatureData,
} from './climate.utils';

describe('Climate Utils (libs/utils/climate.utils.ts)', () => {
  describe('roundClimateValue', () => {
    it('should round positive numbers to 1 decimal place', () => {
      expect(roundClimateValue(12.349)).toBe(12.3);
      expect(roundClimateValue(12.351)).toBe(12.4);
      expect(roundClimateValue(10.0)).toBe(10);
    });

    it('should round negative numbers to 1 decimal place', () => {
      expect(roundClimateValue(-4.56)).toBe(-4.6);
      expect(roundClimateValue(-4.54)).toBe(-4.5);
    });

    it('should preserve exact zero', () => {
      expect(roundClimateValue(0)).toBe(0);
      expect(roundClimateValue(-0)).toBe(0);
    });

    it('should return null for null, undefined, and NaN inputs', () => {
      expect(roundClimateValue(null)).toBeNull();
      expect(roundClimateValue(undefined)).toBeNull();
      expect(roundClimateValue(NaN)).toBeNull();
    });
  });

  describe('normalizeMonthKey', () => {
    it('should normalize standard YYYY-MM and YYYY-M keys', () => {
      expect(normalizeMonthKey('1950-07')).toBe('1950-07');
      expect(normalizeMonthKey('1950-7')).toBe('1950-07');
      expect(normalizeMonthKey('2023-12')).toBe('2023-12');
    });

    it('should normalize slash-separated date strings', () => {
      expect(normalizeMonthKey('1950/7')).toBe('1950-07');
      expect(normalizeMonthKey('1950/07')).toBe('1950-07');
    });

    it('should extract YYYY-MM from full ISO date strings', () => {
      expect(normalizeMonthKey('1984-03-15T00:00:00Z')).toBe('1984-03');
      expect(normalizeMonthKey('2001-01-01')).toBe('2001-01');
    });

    it('should trim surrounding whitespace and return trimmed input if format does not match', () => {
      expect(normalizeMonthKey('  1975-08  ')).toBe('1975-08');
      expect(normalizeMonthKey('invalid-date')).toBe('invalid-date');
      expect(normalizeMonthKey('')).toBe('');
    });
  });

  describe('pivotLongToWideMonthly', () => {
    it('should pivot incoming long records into wide rows and sort chronologically', () => {
      const longRecords: IIncomingClimateRecord[] = [
        { station_id: 'chipata_met', time_value: '1970-02', summary_element: 'rainfall', summary_value: 120.45 },
        { station_id: 'chipata_met', time_value: '1970-01', summary_element: 'rainfall', summary_value: 200.12 },
        { station_id: 'chipata_met', time_value: '1970-01', summary_element: 'mean_tmax', summary_value: 28.34 },
        { station_id: 'chipata_met', time_value: '1970-01', summary_element: 'mean_tmin', summary_value: 17.81 },
      ];

      const wide = pivotLongToWideMonthly(longRecords);

      expect(wide.length).toBe(2);
      expect(wide[0].month).toBe('1970-01');
      expect(wide[0].Rainfall).toBe(200.1);
      expect(wide[0].mean_tmax).toBe(28.3);
      expect(wide[0].mean_tmin).toBe(17.8);

      expect(wide[1].month).toBe('1970-02');
      expect(wide[1].Rainfall).toBe(120.5);
      expect(wide[1].mean_tmax).toBeUndefined();
    });

    it('should support all standard climate element synonyms', () => {
      const records: IIncomingClimateRecord[] = [
        { station_id: 'test', time_value: '1980-01', summary_element: 'rain', summary_value: 50 },
        { station_id: 'test', time_value: '1980-02', summary_element: 'precip', summary_value: 60 },
        { station_id: 'test', time_value: '1980-03', summary_element: 'seasonal_rain', summary_value: 70 },
        { station_id: 'test', time_value: '1980-04', summary_element: 'min_tmin', summary_value: 10 },
        { station_id: 'test', time_value: '1980-04', summary_element: 'max_tmax', summary_value: 30 },
      ];

      const wide = pivotLongToWideMonthly(records);
      expect(wide[0].Rainfall).toBe(50);
      expect(wide[1].Rainfall).toBe(60);
      expect(wide[2].Rainfall).toBe(70);
      expect(wide[3].min_tmin).toBe(10);
      expect(wide[3].max_tmax).toBe(30);
    });

    it('should safely ignore unrecognised elements or malformed time values', () => {
      const records: IIncomingClimateRecord[] = [
        { station_id: 'test', time_value: '', summary_element: 'rainfall', summary_value: 50 },
        { station_id: 'test', time_value: '1980-01', summary_element: 'unknown_metric', summary_value: 99 },
      ];

      const wide = pivotLongToWideMonthly(records);
      expect(wide.length).toBe(0);
    });

    it('should detect duplicate observations and invoke onDuplicate callback', () => {
      const duplicates: any[] = [];
      const records: IIncomingClimateRecord[] = [
        { station_id: 'test', time_value: '1980-01', summary_element: 'rainfall', summary_value: 50 },
        { station_id: 'test', time_value: '1980-01', summary_element: 'rainfall', summary_value: 75 },
      ];

      const wide = pivotLongToWideMonthly(records, {
        onDuplicate: (dup) => duplicates.push(dup),
      });

      expect(duplicates.length).toBe(1);
      expect(duplicates[0]).toEqual({
        stationId: 'test',
        month: '1980-01',
        element: 'Rainfall',
        existingValue: 50,
        incomingValue: 75,
        isConflict: true,
      });
      // Default resolution is last-wins
      expect(wide[0].Rainfall).toBe(75);
    });

    it('should respect resolution: keep-first when configured', () => {
      const records: IIncomingClimateRecord[] = [
        { station_id: 'test', time_value: '1980-01', summary_element: 'rainfall', summary_value: 50 },
        { station_id: 'test', time_value: '1980-01', summary_element: 'rainfall', summary_value: 75 },
      ];

      const wide = pivotLongToWideMonthly(records, {
        resolution: 'keep-first',
      });

      expect(wide[0].Rainfall).toBe(50);
    });

    it('should flag identical duplicates with isConflict: false', () => {
      const duplicates: any[] = [];
      const records: IIncomingClimateRecord[] = [
        { station_id: 'test', time_value: '1980-01', summary_element: 'rainfall', summary_value: 50 },
        { station_id: 'test', time_value: '1980-01', summary_element: 'rainfall', summary_value: 50 },
      ];

      pivotLongToWideMonthly(records, {
        onDuplicate: (dup) => duplicates.push(dup),
      });

      expect(duplicates.length).toBe(1);
      expect(duplicates[0].isConflict).toBe(false);
    });
  });

  describe('stationHasTemperatureData', () => {
    it('should return true when any temperature observation exists', () => {
      const withTemp: IMonthlyStationData[] = [
        { month: '1970-01', Rainfall: 100, mean_tmax: null },
        { month: '1970-02', Rainfall: 80, mean_tmax: 25.5 },
      ];
      expect(stationHasTemperatureData(withTemp)).toBe(true);
    });

    it('should return false for rain-only observations or null temperature values', () => {
      const rainOnly: IMonthlyStationData[] = [
        { month: '1970-01', Rainfall: 100 },
        { month: '1970-02', Rainfall: 80, mean_tmax: null, mean_tmin: undefined },
      ];
      expect(stationHasTemperatureData(rainOnly)).toBe(false);
    });
  });

  describe('formatMonthlyCsv & parseMonthlyCsv', () => {
    it('should format rain-only stations without temperature columns', () => {
      const data: IMonthlyStationData[] = [
        { month: '1970-01', Rainfall: 150.2 },
        { month: '1970-02', Rainfall: null },
      ];

      const csv = formatMonthlyCsv(data);
      expect(csv).toBe('month,Rainfall\n1970-01,150.2\n1970-02,\n');

      const parsed = parseMonthlyCsv(csv);
      expect(parsed.length).toBe(2);
      expect(parsed[0].month).toBe('1970-01');
      expect(parsed[0].Rainfall).toBe(150.2);
      expect(parsed[1].month).toBe('1970-02');
      expect(parsed[1].Rainfall).toBeNull();
    });

    it('should format stations with temperature with full 8 columns and empty cells for nulls', () => {
      const data: IMonthlyStationData[] = [
        {
          month: '1970-01',
          Rainfall: 150.2,
          min_tmin: 15.1,
          mean_tmin: 18.0,
          max_tmin: 20.5,
          min_tmax: 22.0,
          mean_tmax: 27.5,
          max_tmax: 31.0,
        },
        {
          month: '1970-02',
          Rainfall: null,
          min_tmin: null,
          mean_tmin: 17.5,
          max_tmin: null,
          min_tmax: null,
          mean_tmax: null,
          max_tmax: null,
        },
      ];

      const csv = formatMonthlyCsv(data);
      expect(csv).toContain('month,Rainfall,min_tmin,mean_tmin,max_tmin,min_tmax,mean_tmax,max_tmax\n');
      expect(csv).toContain('1970-01,150.2,15.1,18,20.5,22,27.5,31\n');
      expect(csv).toContain('1970-02,,,17.5,,,,\n');

      const parsed = parseMonthlyCsv(csv);
      expect(parsed.length).toBe(2);
      expect(parsed[0].Rainfall).toBe(150.2);
      expect(parsed[0].max_tmin).toBe(20.5);
      expect(parsed[0].min_tmax).toBe(22);
      expect(parsed[0].max_tmax).toBe(31);
      expect(parsed[1].mean_tmin).toBe(17.5);
      expect(parsed[1].Rainfall).toBeNull();
      expect(parsed[1].min_tmin).toBeNull();
      expect(parsed[1].max_tmin).toBeNull();
      expect(parsed[1].min_tmax).toBeNull();
    });

    it('should handle explicit includeTemperature parameter', () => {
      const data: IMonthlyStationData[] = [{ month: '1970-01', Rainfall: 100 }];
      const csvWithTemp = formatMonthlyCsv(data, true);
      expect(csvWithTemp.startsWith('month,Rainfall,min_tmin,mean_tmin,max_tmin,min_tmax,mean_tmax,max_tmax')).toBe(
        true,
      );

      const csvWithoutTemp = formatMonthlyCsv(data, false);
      expect(csvWithoutTemp.startsWith('month,Rainfall\n')).toBe(true);
    });

    it('should return empty array when parsing empty text or header only', () => {
      expect(parseMonthlyCsv('')).toEqual([]);
      expect(parseMonthlyCsv('month,Rainfall\n')).toEqual([]);
    });
  });

  describe('parseAnnualCsv', () => {
    it('should parse standard comma-delimited annual CSV', () => {
      const csv = `Year,Start,End,Length,Rainfall,Extreme_events
1960,320,105,150,850.5,2
1961,315,110,160,920.0,3`;

      const parsed = parseAnnualCsv(csv);
      expect(parsed.length).toBe(2);
      expect(parsed[0].Year).toBe(1960);
      expect(parsed[0].Start).toBe(320);
      expect(parsed[0].Rainfall).toBe(850.5);
      expect(parsed[1].Year).toBe(1961);
      expect(parsed[1].Extreme_events).toBe(3);
    });

    it('should parse tab-delimited annual TSV and treat all-zero season rows as missing', () => {
      const tsv = `Year\tStart\tEnd\tLength\tRainfall\tmin_tmin\tmean_tmin\tmax_tmin\tmin_tmax\tmean_tmax\tmax_tmax
1960\t320\t105\t150\t850.5\t12.1\t15.4\t18.2\t24.1\t28.5\t32.0
1961\t0\t0\t0\t0\t11.5\t14.8\t17.9\t23.5\t27.9\t31.5`;

      const parsed = parseAnnualCsv(tsv);
      expect(parsed.length).toBe(2);
      expect(parsed[0].Year).toBe(1960);
      expect(parsed[0].Rainfall).toBe(850.5);
      expect(parsed[0].Start).toBe(320);

      // In row 2, Start, End, Length, Rainfall were all 0 (legacy missing placeholder) -> converted to null
      expect(parsed[1].Year).toBe(1961);
      expect(parsed[1].Start).toBeNull();
      expect(parsed[1].End).toBeNull();
      expect(parsed[1].Length).toBeNull();
      expect(parsed[1].Rainfall).toBeNull();
      expect(parsed[1].mean_tmax).toBe(27.9);
    });

    it('should strip UTF-8 BOM from header', () => {
      const bomCsv = '\uFEFFYear,Rainfall\n1970,750';
      const parsed = parseAnnualCsv(bomCsv);
      expect(parsed.length).toBe(1);
      expect(parsed[0].Year).toBe(1970);
      expect(parsed[0].Rainfall).toBe(750);
    });

    it('should return empty array for empty text or header only', () => {
      expect(parseAnnualCsv('')).toEqual([]);
      expect(parseAnnualCsv('Year,Rainfall\n')).toEqual([]);
    });
  });

  describe('calculateStationCapabilities', () => {
    it('should determine years, annual charts, and monthly availability flags', () => {
      const annualData: IStationData[] = [
        { Year: 1960, Start: 320, End: 100, Length: 145, Rainfall: 800, Extreme_events: 1 },
        {
          Year: 1961,
          Start: 310,
          End: 95,
          Length: 150,
          Rainfall: 850,
          Extreme_events: 2,
          min_tmax: 20,
          mean_tmax: 25,
          max_tmax: 30,
        },
      ];
      const monthlyData: IMonthlyStationData[] = [
        { month: '1960-01', Rainfall: 150, mean_tmin: 16, mean_tmax: 27 },
        { month: '1961-12', Rainfall: 200, mean_tmin: 17, mean_tmax: 28 },
      ];

      const caps = calculateStationCapabilities({
        annualData,
        monthlyData,
        contentHash: 'hash123',
      });

      expect(caps.schemaVersion).toBe(1);
      expect(caps.contentHash).toBe('hash123');
      expect(caps.years).toEqual([1960, 1961]);
      expect(caps.totalYears).toBe(2);
      expect(caps.completeRainYears).toBe(2);
      expect(caps.completeTempYears).toBe(0);
      expect(caps.annual).toEqual(['rainfall', 'start', 'end', 'length', 'extreme_rainfall_days', 'temp_max']);
      expect(caps.monthly).toEqual(['rainfall', 'temp_min', 'temp_max']);
    });

    it('should handle rain-only station capabilities correctly', () => {
      const annualData = [
        { Year: 1980, Start: 300, End: 90, Length: 150, Rainfall: 700 },
        { Year: 1982, Start: 310, End: 95, Length: 155, Rainfall: 750 },
      ] as IStationData[];
      const monthlyData: IMonthlyStationData[] = [
        { month: '1980-01', Rainfall: 100 },
        { month: '1982-12', Rainfall: 120 },
      ];

      const caps = calculateStationCapabilities({
        annualData,
        monthlyData,
      });

      expect(caps.years).toEqual([1980, 1982]);
      expect(caps.totalYears).toBe(3);
      expect(caps.completeRainYears).toBe(2);
      expect(caps.completeTempYears).toBeUndefined();
      expect(caps.annual).toEqual(['rainfall', 'start', 'end', 'length']);
      expect(caps.monthly).toEqual(['rainfall']);
    });

    it('should handle station with no monthly data', () => {
      const annualData = [{ Year: 1990, Start: 300, End: 90, Length: 150, Rainfall: 600 }] as IStationData[];
      const caps = calculateStationCapabilities({ annualData });

      expect(caps.years).toEqual([1990, 1990]);
      expect(caps.totalYears).toBe(1);
      expect(caps.completeRainYears).toBe(1);
      expect(caps.completeTempYears).toBeUndefined();
      expect(caps.annual).toEqual(['rainfall', 'start', 'end', 'length']);
      expect(caps.monthly).toBeUndefined();
    });

    it('should derive years from monthly data when annual data is absent', () => {
      const monthlyData: IMonthlyStationData[] = [
        { month: '1975-01', Rainfall: 50 },
        { month: '1985-12', Rainfall: 60 },
      ];
      const caps = calculateStationCapabilities({ monthlyData });

      expect(caps.years).toEqual([1975, 1985]);
      expect(caps.totalYears).toBe(11);
      expect(caps.completeRainYears).toBeUndefined();
      expect(caps.completeTempYears).toBeUndefined();
      expect(caps.annual).toBeUndefined();
      expect(caps.monthly).toEqual(['rainfall']);
    });
  });

  describe('auditMonthlyChanges', () => {
    it('should detect historical revisions when values change by more than 0.05', () => {
      const existing: IMonthlyStationData[] = [{ month: '1970-01', Rainfall: 100.0, mean_tmax: 28.0 }];
      const incoming: IMonthlyStationData[] = [
        { month: '1970-01', Rainfall: 100.03, mean_tmax: 29.5 }, // Rain diff < 0.05 (ignored), temp diff 1.5 (flagged)
      ];

      const { revisions, regressions, sanityViolations } = auditMonthlyChanges({
        stationId: 'test_station',
        existingData: existing,
        incomingData: incoming,
      });

      expect(revisions.length).toBe(1);
      expect(revisions[0]).toEqual({
        stationId: 'test_station',
        month: '1970-01',
        metric: 'mean_tmax',
        oldValue: 28.0,
        newValue: 29.5,
        diff: 1.5,
      });
      expect(regressions.length).toBe(0);
      expect(sanityViolations.length).toBe(0);
    });

    it('should detect missingness regressions when valid observation becomes null', () => {
      const existing: IMonthlyStationData[] = [{ month: '1970-01', Rainfall: 120.0, mean_tmin: 15.0 }];
      const incoming: IMonthlyStationData[] = [{ month: '1970-01', Rainfall: 120.0, mean_tmin: null }];

      const { regressions } = auditMonthlyChanges({
        stationId: 'test_station',
        existingData: existing,
        incomingData: incoming,
      });

      expect(regressions.length).toBe(1);
      expect(regressions[0]).toEqual({
        stationId: 'test_station',
        month: '1970-01',
        metric: 'mean_tmin',
        previousValue: 15.0,
      });
    });

    it('should detect physical sanity violations (temperature inversion and negative rainfall)', () => {
      const incoming: IMonthlyStationData[] = [
        {
          month: '1970-01',
          Rainfall: -10,
          min_tmin: 25.0,
          mean_tmin: 20.0, // min > mean violation
          mean_tmax: 18.0, // mean_tmin (20) > mean_tmax (18) inversion
          max_tmax: 15.0, // mean_tmax (18) > max_tmax (15) violation
        },
        {
          month: '1970-02',
          Rainfall: 1600, // exceeds 1500mm threshold
        },
      ];

      const { sanityViolations } = auditMonthlyChanges({
        stationId: 'test_station',
        existingData: [],
        incomingData: incoming,
      });

      expect(sanityViolations.length).toBe(5);
      const rules = sanityViolations.map((v) => v.rule);
      expect(rules).toContain('RAINFALL_NON_NEGATIVE');
      expect(rules).toContain('TEMP_MIN_EXCEEDS_MEAN');
      expect(rules).toContain('TEMP_MEAN_EXCEEDS_MAX');
      expect(rules).toContain('TEMP_INVERSION_TMIN_TMAX');
      expect(rules).toContain('RAINFALL_EXTREME_OUTLIER');
    });

    it('should flag invalid month numbers outside 1-12', () => {
      const incoming: IMonthlyStationData[] = [
        { month: '1970-13', Rainfall: 50 },
        { month: '1970-00', Rainfall: 50 },
      ];

      const { sanityViolations } = auditMonthlyChanges({
        stationId: 'test_station',
        existingData: [],
        incomingData: incoming,
      });

      expect(sanityViolations.length).toBe(2);
      expect(sanityViolations.every((v) => v.rule === 'CALENDAR_MONTH_RANGE')).toBe(true);
    });
  });

  describe('generateMarkdownAuditReport', () => {
    it('should format a clean markdown audit report with tables and warnings', () => {
      const md = generateMarkdownAuditReport({
        timestamp: '2026-09-09T10:00:00Z',
        totalStationsProcessed: 1,
        stationsSummary: [
          {
            id: 'chipata_met',
            status: 'UPDATED',
            years: [1950, 2020],
            totalYears: 71,
            diffTotalYears: 1,
            completeRainYears: 68,
            completeTempYears: 50,
            monthly: ['rainfall', 'temp_min', 'temp_max'],
            hash: 'abc123456789',
          },
        ],
        warnings: ['Sample test warning message'],
        historicalRevisions: [
          {
            stationId: 'chipata_met',
            month: '1970-01',
            metric: 'Rainfall',
            oldValue: 100,
            newValue: 110,
            diff: 10,
          },
        ],
        missingnessRegressions: [
          {
            stationId: 'chipata_met',
            month: '1975-05',
            metric: 'mean_tmin',
            previousValue: 14.5,
          },
        ],
        sanityViolations: [
          {
            stationId: 'chipata_met',
            month: '1980-03',
            rule: 'RAINFALL_NON_NEGATIVE',
            message: 'Rainfall is negative',
            values: { Rainfall: -5 },
          },
        ],
      });

      expect(md).toContain('# Climate Data Sync & Health Audit Report');
      expect(md).toContain('chipata_met');
      expect(md).toContain('1950–2020');
      expect(md).toContain('**Total Warnings**: `1`');
      expect(md).toContain('Total Yrs');
      expect(md).toContain('Complete Rain Yrs');
      expect(md).toContain('Complete Temp Yrs');
      expect(md).toContain('Historical Revisions (1)');
      expect(md).toContain('Missingness Regressions (1)');
      expect(md).toContain('Physical Consistency Sanity Checks (1)');
      expect(md).toContain('+10');
      expect(md).toContain('## 5. Sync Warnings (1)');
      expect(md).toContain('Sample test warning message');
    });

    it('should display clean messages when no revisions or regressions are present', () => {
      const md = generateMarkdownAuditReport({
        timestamp: '2026-09-09T10:00:00Z',
        totalStationsProcessed: 1,
        stationsSummary: [
          {
            id: 'kasama_met',
            status: 'UNCHANGED',
            years: [1960, 2024],
            totalYears: 65,
            completeRainYears: 65,
            completeTempYears: undefined,
            monthly: ['rainfall'],
          },
        ],
        historicalRevisions: [],
        missingnessRegressions: [],
        sanityViolations: [],
      });

      expect(md).toContain('**Total Warnings**: `0`');
      expect(md).toContain('No previously published historical data was modified.');
      expect(md).toContain('No regressions detected (no valid data became missing).');
      expect(md).toContain('All records passed temperature ordering, positive rainfall, and calendar sanity rules.');
      expect(md).toContain('No warnings were generated during this run.');
    });

    it('should separate stations into Subtractive, Additive, Value-Update Only, and Unchanged sections', () => {
      const md = generateMarkdownAuditReport({
        timestamp: '2026-09-09',
        totalStationsProcessed: 4,
        stationsSummary: [
          // Subtractive change (completeRainYears dropped by 1)
          {
            country: 'MW',
            id: 'salima',
            status: 'UPDATED',
            years: [1960, 2024],
            totalYears: 65,
            completeRainYears: 60,
            diffCompleteRainYears: -1,
          },
          // Additive change (totalYears increased by 1)
          {
            country: 'ZM',
            id: 'chipata_met',
            status: 'UPDATED',
            years: [1950, 2021],
            totalYears: 72,
            diffTotalYears: 1,
            completeRainYears: 65,
          },
          // Value-update only (status UPDATED, no diffs)
          {
            country: 'MW',
            id: 'bolero',
            status: 'UPDATED',
            years: [1961, 2025],
            totalYears: 65,
            completeRainYears: 60,
            diffTotalYears: 0,
            diffCompleteRainYears: 0,
          },
          // Unchanged station
          {
            country: 'ZW',
            id: 'plumtree',
            status: 'UNCHANGED',
            years: [1963, 2022],
            totalYears: 60,
          },
        ],
        historicalRevisions: [],
        missingnessRegressions: [],
        sanityViolations: [],
      });

      // 1. Subtractive changes displayed first with full table
      expect(md).toContain('### Subtractive Changes (1)');
      expect(md).toContain('| MW | **salima** | `UPDATED` | 1960–2024 | 65 | 60 (-1) | — | — | — |');

      // 2. Additive changes displayed second with full table
      expect(md).toContain('### Additive Changes (1)');
      expect(md).toContain('| ZM | **chipata_met** | `UPDATED` | 1950–2021 | 72 (+1) | 65 | — | — | — |');

      // 3. Value-update only displayed third with simple 2-column table
      expect(md).toContain('### Value-Update Only (1)');
      expect(md).toContain('| MW | **bolero** |');
      // Bolero should NOT be in a 9-column table
      expect(md).not.toContain('| MW | **bolero** | `UPDATED` |');

      // 4. Unchanged stations collapsed
      expect(md).toContain('### Unchanged Stations (1)');
      expect(md).toContain('<details>');
      expect(md).toContain('| ZW | **plumtree** |');

      // Verify ordering in output: Subtractive before Additive before Value-Update before Unchanged
      const idxSubtractive = md.indexOf('### Subtractive Changes');
      const idxAdditive = md.indexOf('### Additive Changes');
      const idxValueUpdate = md.indexOf('### Value-Update Only');
      const idxUnchanged = md.indexOf('### Unchanged Stations');

      expect(idxSubtractive).toBeLessThan(idxAdditive);
      expect(idxAdditive).toBeLessThan(idxValueUpdate);
      expect(idxValueUpdate).toBeLessThan(idxUnchanged);
    });

    it('should separate country code from station ID and format metric diffs', () => {
      const md = generateMarkdownAuditReport({
        timestamp: '2026-09-09',
        totalStationsProcessed: 2,
        stationsSummary: [
          {
            country: 'MW',
            id: 'mw:baka_agric_research',
            status: 'UPDATED',
            years: [1959, 2025],
            totalYears: 67,
            diffTotalYears: 1,
            completeRainYears: 62,
            diffCompleteRainYears: -1,
            completeTempYears: 30,
            diffCompleteTempYears: 0,
          },
          {
            country: 'ZM',
            id: 'chipata_met',
            status: 'UNCHANGED',
            years: [1960, 2020],
            totalYears: 61,
            completeRainYears: 55,
            completeTempYears: 20,
          },
        ],
        historicalRevisions: [],
        missingnessRegressions: [],
        sanityViolations: [],
      });

      expect(md).toContain(
        '| Country | Station ID | Status | Historical Range | Total Yrs | Complete Rain Yrs | Complete Temp Yrs | Monthly Charts | Content Hash |',
      );
      // MW station has separate columns and diffs for changed values (+1, -1, plain for 0)
      expect(md).toContain('| MW | **baka_agric_research** | `UPDATED` | 1959–2025 | 67 (+1) | 62 (-1) | 30 | — | — |');
      // ZM station has separate columns and plain values without diffs
      expect(md).toContain('| ZM | **chipata_met** | `UNCHANGED` | 1960–2020 | 61 | 55 | 20 | — | — |');
    });

    it('should group warnings by type and format station warnings in a Country/Station table', () => {
      const md = generateMarkdownAuditReport({
        timestamp: '2026-09-09',
        totalStationsProcessed: 3,
        stationsSummary: [],
        historicalRevisions: [],
        missingnessRegressions: [],
        sanityViolations: [],
        warnings: [
          {
            message: 'Station has DB data but no entry in metadata.ts',
            country: 'MW',
            stationId: 'salima_airport',
          },
          {
            message: 'Station has DB data but no entry in metadata.ts',
            country: 'MW',
            stationId: 'mangochi_met',
          },
          {
            message: 'Station has database record but zero annual data entries',
            country: 'ZM',
            stationId: 'kabompo_met',
          },
          'No climate_station_data rows found in database for ZW',
        ],
      });

      expect(md).toContain('## 5. Sync Warnings (4)');
      expect(md).toContain('### Station has DB data but no entry in metadata.ts (2)');
      expect(md).toContain('| Country | Station ID |');
      expect(md).toContain('| MW | **salima_airport** |');
      expect(md).toContain('| MW | **mangochi_met** |');
      expect(md).toContain('### Station has database record but zero annual data entries (1)');
      expect(md).toContain('| ZM | **kabompo_met** |');
      expect(md).toContain('### No climate_station_data rows found in database (1)');
      expect(md).toContain('- **ZW**');
    });
  });

  describe('filterMonthlyDataByMonth', () => {
    const monthlyData: IMonthlyStationData[] = [
      { month: '1980-01', Rainfall: 100, mean_tmin: 15.5 },
      { month: '1980-10', Rainfall: 20, mean_tmin: 18.2 },
      { month: '1981-10', Rainfall: 25, mean_tmin: 19.0 },
      { month: '1982-10', Rainfall: null, mean_tmin: null },
      { month: '1982-11', Rainfall: 40, mean_tmin: 17.5 },
    ];

    it('should filter records strictly matching the target month number', () => {
      const filtered = filterMonthlyDataByMonth(monthlyData, 10);
      expect(filtered.length).toBe(3);
      expect(filtered.map((r) => r.Year)).toEqual([1980, 1981, 1982]);
      expect(filtered[0].Rainfall).toBe(20);
      expect(filtered[0].mean_tmin).toBe(18.2);
      expect(filtered[1].Rainfall).toBe(25);
      expect(filtered[2].Rainfall).toBeNull();
    });

    it('should return empty array when month has no records', () => {
      expect(filterMonthlyDataByMonth(monthlyData, 6)).toEqual([]);
    });
  });

  describe('convertMonthlyToStationData', () => {
    const monthlyData: IMonthlyStationData[] = [
      { month: '1980-01', Rainfall: 100, min_tmin: 14.0, mean_tmin: 15.5 },
      { month: '1980-10', Rainfall: 20, min_tmin: 16.0, mean_tmin: 18.2 },
      { month: '1981-06', Rainfall: 0, min_tmin: 8.0, mean_tmin: 12.0 },
      { month: 'invalid-date', Rainfall: 10 },
    ];

    it('should convert all valid monthly records to station data rows with Year', () => {
      const converted = convertMonthlyToStationData(monthlyData);
      expect(converted.length).toBe(3);
      expect(converted.map((r) => r.Year)).toEqual([1980, 1980, 1981]);
      expect(converted[0].Rainfall).toBe(100);
      expect(converted[0].min_tmin).toBe(14.0);
      expect(converted[2].min_tmin).toBe(8.0);
    });

    it('should return empty array when monthly data is empty', () => {
      expect(convertMonthlyToStationData([])).toEqual([]);
    });
  });

  describe('aggregateThreeMonthSeries', () => {
    const djfPeriod = { id: 'djf', code: 'DJF', months: [12, 1, 2] as [number, number, number] };

    it('should aggregate DJF cross-year period across consecutive season months', () => {
      // Season 1980: Dec 1980, Jan 1981, Feb 1981
      const monthlyData: IMonthlyStationData[] = [
        { month: '1980-12', Rainfall: 200, min_tmin: 14.0, mean_tmin: 18.0, max_tmax: 30.0, mean_tmax: 26.0 },
        { month: '1981-01', Rainfall: 250, min_tmin: 12.5, mean_tmin: 17.0, max_tmax: 32.0, mean_tmax: 27.0 },
        { month: '1981-02', Rainfall: 150, min_tmin: 13.0, mean_tmin: 17.5, max_tmax: 29.0, mean_tmax: 25.0 },
      ];

      const aggregated = aggregateThreeMonthSeries(monthlyData, djfPeriod);
      expect(aggregated.length).toBe(1);
      expect(aggregated[0].Year).toBe(1980);
      // Rainfall sum = 200 + 250 + 150 = 600
      expect(aggregated[0].Rainfall).toBe(600);
      // min_tmin = min(14.0, 12.5, 13.0) = 12.5
      expect(aggregated[0].min_tmin).toBe(12.5);
      // max_tmax = max(30.0, 32.0, 29.0) = 32.0
      expect(aggregated[0].max_tmax).toBe(32);
      // mean_tmin = (18 + 17 + 17.5) / 3 = 17.5
      expect(aggregated[0].mean_tmin).toBe(17.5);
      // mean_tmax = (26 + 27 + 25) / 3 = 26
      expect(aggregated[0].mean_tmax).toBe(26);
    });

    it('should strictly return null for rainfall if any month in the 3-month period is missing', () => {
      // Missing Feb 1981
      const monthlyData: IMonthlyStationData[] = [
        { month: '1980-12', Rainfall: 200, min_tmin: 14.0, max_tmax: 30.0 },
        { month: '1981-01', Rainfall: 250, min_tmin: 12.5, max_tmax: 32.0 },
      ];

      const aggregated = aggregateThreeMonthSeries(monthlyData, djfPeriod);
      expect(aggregated.length).toBe(1);
      expect(aggregated[0].Rainfall).toBeNull();
      // Temperature extremes can still be computed from available months
      expect(aggregated[0].min_tmin).toBe(12.5);
      expect(aggregated[0].max_tmax).toBe(32);
    });

    it('should strictly return null for rainfall if any month has null rainfall value', () => {
      const monthlyData: IMonthlyStationData[] = [
        { month: '1980-12', Rainfall: 200 },
        { month: '1981-01', Rainfall: null },
        { month: '1981-02', Rainfall: 150 },
      ];

      const aggregated = aggregateThreeMonthSeries(monthlyData, djfPeriod);
      expect(aggregated.length).toBe(1);
      expect(aggregated[0].Rainfall).toBeNull();
    });
  });

  describe('convertStationSummariesToRows', () => {
    it('should correctly merge rainfall and temperature arrays sorted by year', () => {
      const rainfall = [
        { year: 1970, seasonal_rain: 850, start_rains_doy: 300, end_rains_doy: 90, season_length: 155 },
        { year: 1971, seasonal_rain: 920, start_rains_doy: 310, end_season_doy: 95, season_length: 150 },
      ];
      const temperature = [
        { year: 1969, mean_tmax: 29.44, min_tmin: 12.19 },
        { year: 1970, mean_tmax: 30.12, min_tmin: 11.81 },
      ];

      const rows = convertStationSummariesToRows(rainfall, temperature);
      expect(rows.length).toBe(3);
      expect(rows.map((r) => r.Year)).toEqual([1969, 1970, 1971]);

      // 1969: temp only
      expect(rows[0].Year).toBe(1969);
      expect(rows[0].mean_tmax).toBe(29.4);
      expect(rows[0].min_tmin).toBe(12.2);
      expect(rows[0].Rainfall).toBeUndefined();

      // 1970: merged
      expect(rows[1].Year).toBe(1970);
      expect(rows[1].Rainfall).toBe(850);
      expect(rows[1].Start).toBe(300);
      expect(rows[1].End).toBe(90);
      expect(rows[1].Length).toBe(155);
      expect(rows[1].mean_tmax).toBe(30.1);
      expect(rows[1].min_tmin).toBe(11.8);

      // 1971: rainfall only with end_season_doy fallback
      expect(rows[2].Year).toBe(1971);
      expect(rows[2].End).toBe(95);
      expect(rows[2].mean_tmax).toBeUndefined();
    });

    it('should normalize 0 seasonal rain and 0 doy values to undefined', () => {
      const rainfall = [{ year: 1980, seasonal_rain: 0, start_rains_doy: 0, end_rains_doy: 0, season_length: 0 }];
      const rows = convertStationSummariesToRows(rainfall, []);
      expect(rows.length).toBe(1);
      expect(rows[0].Rainfall).toBeUndefined();
      expect(rows[0].Start).toBeUndefined();
      expect(rows[0].End).toBeUndefined();
      expect(rows[0].Length).toBeUndefined();
    });
  });

  describe('stationHasAnnualTemperature', () => {
    it('should return true if any temperature metric is present', () => {
      expect(
        stationHasAnnualTemperature([
          { Year: 1980, Start: 1, End: 2, Length: 3, Rainfall: 10, Extreme_events: 0, mean_tmax: 25.5 },
        ]),
      ).toBe(true);
    });

    it('should return false if no temperature metric is present', () => {
      expect(
        stationHasAnnualTemperature([{ Year: 1980, Start: 1, End: 2, Length: 3, Rainfall: 10, Extreme_events: 0 }]),
      ).toBe(false);
    });
  });

  describe('formatAnnualCsv', () => {
    it('should omit temperature columns when station has no temperature data', () => {
      const data: IStationData[] = [
        { Year: 1980, Start: 300, End: 90, Length: 155, Rainfall: 850, Extreme_events: undefined as any },
        { Year: 1981, Start: 310, End: 95, Length: 150, Rainfall: 920, Extreme_events: undefined as any },
      ];
      const csv = formatAnnualCsv(data);
      expect(csv).toBe('Year,Start,End,Length,Rainfall\n1980,300,90,155,850\n1981,310,95,150,920\n');
    });

    it('should include all columns when station has temperature observations', () => {
      const data: IStationData[] = [
        {
          Year: 1980,
          Start: 300,
          End: 90,
          Length: 155,
          Rainfall: 850,
          max_tmax: 35.0,
          max_tmin: 22.0,
          min_tmax: 20.0,
          min_tmin: 10.0,
          mean_tmax: 28.5,
          mean_tmin: 16.2,
          Extreme_events: undefined as any,
        },
      ];
      const csv = formatAnnualCsv(data);
      expect(csv).toContain(
        'Year,Start,End,Length,Rainfall,max_tmax,max_tmin,min_tmax,min_tmin,mean_tmax,mean_tmin,Extreme_events\n',
      );
      expect(csv).toContain('1980,300,90,155,850,35,22,20,10,28.5,16.2,\n');
    });
  });

  describe('resolveClimateProducts', () => {
    it('should return all products when filter is undefined or empty', () => {
      const all = resolveClimateProducts();
      expect(all.size).toBe(7);
      expect(all.has('rainfall')).toBe(true);
      expect(all.has('temp_min')).toBe(true);
      expect(all.has('temp_max')).toBe(true);
      expect(all.has('start')).toBe(true);
      expect(all.has('end')).toBe(true);
      expect(all.has('length')).toBe(true);
      expect(all.has('extremes')).toBe(true);

      const emptyStr = resolveClimateProducts('');
      expect(emptyStr.size).toBe(7);

      const emptyArr = resolveClimateProducts([]);
      expect(emptyArr.size).toBe(7);
    });

    it("should resolve 'temperature' group alias to ['temp_min', 'temp_max']", () => {
      const tempSet = resolveClimateProducts('temperature');
      expect(tempSet.size).toBe(2);
      expect(tempSet.has('temp_min')).toBe(true);
      expect(tempSet.has('temp_max')).toBe(true);
      expect(tempSet.has('rainfall')).toBe(false);
    });

    it("should resolve 'seasonal' group alias to seasonal products", () => {
      const seasonSet = resolveClimateProducts('seasonal');
      expect(seasonSet.size).toBe(5);
      expect(seasonSet.has('rainfall')).toBe(true);
      expect(seasonSet.has('start')).toBe(true);
      expect(seasonSet.has('end')).toBe(true);
      expect(seasonSet.has('length')).toBe(true);
      expect(seasonSet.has('extremes')).toBe(true);
      expect(seasonSet.has('temp_min')).toBe(false);
      expect(seasonSet.has('temp_max')).toBe(false);
    });

    it('should resolve individual product names and comma-separated tokens', () => {
      const single = resolveClimateProducts('temp_min');
      expect(single.size).toBe(1);
      expect(single.has('temp_min')).toBe(true);

      const multi = resolveClimateProducts('temp_min,temp_max');
      expect(multi.size).toBe(2);
      expect(multi.has('temp_min')).toBe(true);
      expect(multi.has('temp_max')).toBe(true);
    });

    it('should normalize extreme_rainfall_days to extremes', () => {
      const extremes = resolveClimateProducts('extreme_rainfall_days');
      expect(extremes.size).toBe(1);
      expect(extremes.has('extremes')).toBe(true);
    });

    it('should throw descriptive error on unknown product or group', () => {
      expect(() => resolveClimateProducts('invalid_product')).toThrow(/Unknown climate product or group/);
    });
  });

  describe('mergeStationAnnualData', () => {
    const existing: IStationData[] = [
      {
        Year: 1980,
        Start: 300,
        End: 90,
        Length: 155,
        Rainfall: 850,
        Extreme_events: 2,
        mean_tmax: 28.0,
        mean_tmin: 16.0,
      },
      {
        Year: 1981,
        Start: 310,
        End: 95,
        Length: 150,
        Rainfall: 920,
        Extreme_events: 1,
        mean_tmax: 29.0,
        mean_tmin: 17.0,
      },
    ];

    it('should strictly preserve rainfall columns when updating only temperature', () => {
      const incoming: (Partial<IStationData> & { Year: number })[] = [
        { Year: 1980, mean_tmax: 30.5, mean_tmin: 18.2, min_tmin: 10.1, max_tmax: 36.0 },
        { Year: 1981, mean_tmax: 31.0, mean_tmin: 19.0, min_tmin: 11.0, max_tmax: 37.0 },
      ];

      const merged = mergeStationAnnualData(existing, incoming, new Set(['temp_min', 'temp_max']));

      expect(merged.length).toBe(2);
      // Preserved seasonal values
      expect(merged[0].Start).toBe(300);
      expect(merged[0].End).toBe(90);
      expect(merged[0].Length).toBe(155);
      expect(merged[0].Rainfall).toBe(850);
      expect(merged[0].Extreme_events).toBe(2);

      // Updated temperature values
      expect(merged[0].mean_tmax).toBe(30.5);
      expect(merged[0].mean_tmin).toBe(18.2);
      expect(merged[0].min_tmin).toBe(10.1);
      expect(merged[0].max_tmax).toBe(36.0);
    });

    it('should append new years present only in incoming data with empty unselected fields', () => {
      const incoming: (Partial<IStationData> & { Year: number })[] = [
        { Year: 1979, mean_tmax: 27.5, mean_tmin: 15.5 },
        { Year: 1980, mean_tmax: 30.0, mean_tmin: 18.0 },
      ];

      const merged = mergeStationAnnualData(existing, incoming, new Set(['temp_min', 'temp_max']));

      expect(merged.length).toBe(3);
      expect(merged[0].Year).toBe(1979);
      expect(merged[0].mean_tmax).toBe(27.5);
      expect(merged[0].Rainfall).toBeUndefined();
      expect(merged[0].Start).toBeUndefined();

      expect(merged[1].Year).toBe(1980);
      expect(merged[1].Rainfall).toBe(850);
      expect(merged[1].mean_tmax).toBe(30.0);
    });

    it('should strictly preserve temperature columns when updating only seasonal', () => {
      const incoming: IStationData[] = [
        { Year: 1980, Rainfall: 999, Start: 290, End: 85, Length: 160, Extreme_events: 0 },
      ];

      const merged = mergeStationAnnualData(existing, incoming, new Set(['rainfall', 'start', 'end', 'length']));

      expect(merged[0].Rainfall).toBe(999);
      expect(merged[0].Start).toBe(290);
      // Temperature preserved
      expect(merged[0].mean_tmax).toBe(28.0);
      expect(merged[0].mean_tmin).toBe(16.0);
    });
  });

  describe('mergeStationMonthlyData', () => {
    const existingMonthly: IMonthlyStationData[] = [
      { month: '1980-01', Rainfall: 150, mean_tmax: 27.0, mean_tmin: 18.0 },
      { month: '1980-02', Rainfall: 120, mean_tmax: 28.0, mean_tmin: 19.0 },
    ];

    it('should preserve monthly rainfall when updating monthly temperature', () => {
      const incoming: IMonthlyStationData[] = [
        { month: '1980-01', mean_tmax: 29.5, mean_tmin: 17.5, min_tmin: 12.0, max_tmax: 33.0 },
      ];

      const merged = mergeStationMonthlyData(existingMonthly, incoming, new Set(['temp_min', 'temp_max']));

      expect(merged.length).toBe(2);
      expect(merged[0].month).toBe('1980-01');
      expect(merged[0].Rainfall).toBe(150);
      expect(merged[0].mean_tmax).toBe(29.5);
      expect(merged[0].min_tmin).toBe(12.0);

      // Month with no incoming update gets null/undefined for temperature
      expect(merged[1].month).toBe('1980-02');
      expect(merged[1].Rainfall).toBe(120);
      expect(merged[1].mean_tmax).toBeNull();
    });

    it('should append new months from incoming data', () => {
      const incoming: IMonthlyStationData[] = [{ month: '1979-12', mean_tmax: 26.0, mean_tmin: 17.0 }];

      const merged = mergeStationMonthlyData(existingMonthly, incoming, new Set(['temp_min', 'temp_max']));

      expect(merged.length).toBe(3);
      expect(merged[0].month).toBe('1979-12');
      expect(merged[0].mean_tmax).toBe(26.0);
      expect(merged[0].Rainfall).toBeUndefined();
    });
  });

  describe('convertMonthlyTemperatureSummariesToRows', () => {
    it('should convert and sort database records with numeric year and month', () => {
      const raw = [
        { year: 1980, month: 2, mean_tmax: 28.54, mean_tmin: 17.16 },
        { year: 1980, month: 1, mean_tmax: 27.31, mean_tmin: 16.49 },
      ];

      const rows = convertMonthlyTemperatureSummariesToRows(raw);
      expect(rows.length).toBe(2);
      expect(rows[0].month).toBe('1980-01');
      expect(rows[0].mean_tmax).toBe(27.3);
      expect(rows[0].mean_tmin).toBe(16.5);

      expect(rows[1].month).toBe('1980-02');
      expect(rows[1].mean_tmax).toBe(28.5);
      expect(rows[1].mean_tmin).toBe(17.2);
    });

    it('should return empty array for null, undefined, or empty data', () => {
      expect(convertMonthlyTemperatureSummariesToRows(null)).toEqual([]);
      expect(convertMonthlyTemperatureSummariesToRows(undefined)).toEqual([]);
      expect(convertMonthlyTemperatureSummariesToRows([])).toEqual([]);
    });
  });
  describe('resolveClimateApiActions', () => {
    it('should return all API summary actions when all products are targeted', () => {
      const all = resolveClimateProducts();
      const actions = resolveClimateApiActions(all);
      expect(actions).toEqual([
        'rainfall-summaries',
        'crop-probabilities',
        'annual-temperature',
        'monthly-temperatures',
      ]);
    });

    it('should return only rainfall-summaries for rainfall filter', () => {
      const products = resolveClimateProducts('rainfall');
      const actions = resolveClimateApiActions(products);
      expect(actions).toEqual(['rainfall-summaries', 'crop-probabilities']);
    });

    it('should return temperature actions for temperature group alias', () => {
      const products = resolveClimateProducts('temperature');
      const actions = resolveClimateApiActions(products);
      expect(actions).toEqual(['annual-temperature', 'monthly-temperatures']);
    });

    it('should return temperature actions for temp_min or temp_max', () => {
      const products = resolveClimateProducts('temp_min');
      const actions = resolveClimateApiActions(products);
      expect(actions).toEqual(['annual-temperature', 'monthly-temperatures']);
    });
  });
});
