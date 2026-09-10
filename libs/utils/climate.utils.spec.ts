import type { IIncomingClimateRecord, IMonthlyStationData, IStationData } from '@picsa/models';
import {
  auditMonthlyChanges,
  calculateStationCapabilities,
  aggregateThreeMonthSeries,
  filterMonthlyDataByMonth,
  formatMonthlyCsv,
  generateMarkdownAuditReport,
  normalizeMonthKey,
  parseAnnualCsv,
  parseMonthlyCsv,
  pivotLongToWideMonthly,
  roundClimateValue,
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
      expect(caps.totalMissingYears).toBe(0);
      expect(caps.annual).toEqual(['rainfall', 'start', 'end', 'length', 'extreme_rainfall_days', 'temp_max']);
      expect(caps.monthly).toEqual(['rainfall', 'temp_min', 'temp_max']);
    });

    it('should handle rain-only station capabilities correctly', () => {
      const annualData = [
        { Year: 1980, Rainfall: 700 },
        { Year: 1982, Rainfall: 750 },
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
      // 1980, 1981, 1982 -> span 3 years, 1981 missing -> totalMissingYears = 1
      expect(caps.totalMissingYears).toBe(1);
      expect(caps.annual).toEqual(['rainfall']);
      expect(caps.monthly).toEqual(['rainfall']);
    });

    it('should handle station with no monthly data', () => {
      const annualData = [{ Year: 1990, Rainfall: 600 }] as IStationData[];
      const caps = calculateStationCapabilities({ annualData });

      expect(caps.years).toEqual([1990, 1990]);
      expect(caps.totalMissingYears).toBe(0);
      expect(caps.annual).toEqual(['rainfall']);
      expect(caps.monthly).toBeUndefined();
    });

    it('should derive years from monthly data when annual data is absent', () => {
      const monthlyData: IMonthlyStationData[] = [
        { month: '1975-01', Rainfall: 50 },
        { month: '1985-12', Rainfall: 60 },
      ];
      const caps = calculateStationCapabilities({ monthlyData });

      expect(caps.years).toEqual([1975, 1985]);
      // 1975 to 1985 is 11 years, only 2 valid years observed -> 9 missing years
      expect(caps.totalMissingYears).toBe(9);
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
            totalMissingYears: 2,
            monthly: ['rainfall', 'temp_min', 'temp_max'],
            hash: 'abc123456789',
          },
        ],
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
      expect(md).toContain('Historical Revisions (1)');
      expect(md).toContain('Missingness Regressions (1)');
      expect(md).toContain('Physical Consistency Sanity Checks (1)');
      expect(md).toContain('+10');
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
            totalMissingYears: 0,
            monthly: ['rainfall'],
          },
        ],
        historicalRevisions: [],
        missingnessRegressions: [],
        sanityViolations: [],
      });

      expect(md).toContain('No previously published historical data was modified.');
      expect(md).toContain('No regressions detected (no valid data became missing).');
      expect(md).toContain('All records passed temperature ordering, positive rainfall, and calendar sanity rules.');
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
});
