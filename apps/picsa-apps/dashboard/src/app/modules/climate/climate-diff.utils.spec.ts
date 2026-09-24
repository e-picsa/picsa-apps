import { IStationData } from '@picsa/models';

import { CLIMATE_PRODUCTS, compareStationDatasets, generateDiffChartConfig } from './climate-diff.utils';

describe('climate-diff.utils', () => {
  const sampleAppData: IStationData[] = [
    { Year: 1980, Rainfall: 850, Start: 310, End: 75, Length: 130 },
    { Year: 1981, Rainfall: 920, Start: 305, End: 80, Length: 140 },
    { Year: 1982, Rainfall: 780, Start: 320, End: 70, Length: 115 },
  ];

  const sampleDbData: IStationData[] = [
    { Year: 1981, Rainfall: 920, Start: 305, End: 80, Length: 140 },
    { Year: 1982, Rainfall: 795, Start: 320, End: 70, Length: 115 }, // Rainfall modified (780 -> 795)
    { Year: 1983, Rainfall: 890, Start: 315, End: 85, Length: 135 }, // Added year
  ];

  describe('compareStationDatasets', () => {
    it('should return no_data when both datasets are null or empty', () => {
      const res = compareStationDatasets('station_1', null, null);
      expect(res.status).toBe('no_data');
      expect(res.hasAppData).toBe(false);
      expect(res.hasDbData).toBe(false);
    });

    it('should return app_only when only app data exists', () => {
      const res = compareStationDatasets('station_1', sampleAppData, []);
      expect(res.status).toBe('app_only');
      expect(res.hasAppData).toBe(true);
      expect(res.hasDbData).toBe(false);
      expect(res.totalYearsRemovedCount).toBeGreaterThan(0);
    });

    it('should return db_only when only db data exists', () => {
      const res = compareStationDatasets('station_1', [], sampleDbData);
      expect(res.status).toBe('db_only');
      expect(res.hasAppData).toBe(false);
      expect(res.hasDbData).toBe(true);
      expect(res.totalYearsAddedCount).toBeGreaterThan(0);
    });

    it('should return in_sync when app and db data match', () => {
      const res = compareStationDatasets('station_1', sampleAppData, sampleAppData);
      expect(res.status).toBe('in_sync');
      expect(res.totalYearsAddedCount).toBe(0);
      expect(res.totalYearsRemovedCount).toBe(0);
      expect(res.totalChangedValuesCount).toBe(0);
    });

    it('should detect added years in DB', () => {
      const res = compareStationDatasets('station_1', sampleAppData, sampleDbData);
      const rainfall = res.products.rainfall;
      expect(rainfall.yearsAdded).toEqual([1983]);
    });

    it('should detect removed years (in App but missing in DB)', () => {
      const res = compareStationDatasets('station_1', sampleAppData, sampleDbData);
      const rainfall = res.products.rainfall;
      expect(rainfall.yearsRemoved).toEqual([1980]);
    });

    it('should detect modified values for matching years', () => {
      const res = compareStationDatasets('station_1', sampleAppData, sampleDbData);
      const rainfall = res.products.rainfall;
      expect(rainfall.changedCount).toBe(1);
      const modified = rainfall.changes.find((c) => c.type === 'value_changed');
      expect(modified).toBeDefined();
      expect(modified?.year).toBe(1982);
      expect(modified?.appValue).toBe(780);
      expect(modified?.dbValue).toBe(795);
      expect(modified?.diff).toBe(15);
    });

    it('should ignore minute floating point noise below 0.05 tolerance', () => {
      const dbWithFloat: IStationData[] = [
        { Year: 1980, Rainfall: 850.0001, Start: 310, End: 75, Length: 130 },
        { Year: 1981, Rainfall: 920, Start: 305, End: 80, Length: 140 },
        { Year: 1982, Rainfall: 780, Start: 320, End: 70, Length: 115 },
      ];
      const res = compareStationDatasets('station_1', sampleAppData, dbWithFloat);
      expect(res.products.rainfall.changedCount).toBe(0);
      expect(res.products.rainfall.isInSync).toBe(true);
    });

    it('should handle multi-key products correctly (e.g. min/mean temperature)', () => {
      const appTemp: any[] = [{ Year: 2000, min_tmin: 14.5, mean_tmin: 21.0 }];
      const dbTemp: any[] = [{ Year: 2000, min_tmin: 12.0, mean_tmin: 21.0 }];

      const res = compareStationDatasets('station_1', appTemp, dbTemp);
      const tempSummary = res.products.temp_min; // min/mean temp product
      expect(tempSummary.changedCount).toBe(1);
      expect(tempSummary.changes[0]).toMatchObject({
        year: 2000,
        field: 'min_tmin',
        appValue: 14.5,
        dbValue: 12.0,
      });
    });
  });

  describe('generateDiffChartConfig', () => {
    it('should generate overlaid series config with DB and App lines', () => {
      const rainfallDef = CLIMATE_PRODUCTS[0];
      const config = generateDiffChartConfig(sampleAppData, sampleAppData, rainfallDef);

      expect(config.data).toBeDefined();
      expect(config.data?.x).toBe('Year');
      expect(config.data?.keys?.value).toContain('Rainfall_db');
      expect(config.data?.keys?.value).toContain('Rainfall_app');
      expect(config.data?.names?.Rainfall_db).toBe('Data System');
      expect(config.data?.names?.Rainfall_app).toBe('App Data');
      expect(config.legend?.show).toBe(true);
      expect(config.tooltip?.grouped).toBe(true);
    });

    it('should handle empty data gracefully', () => {
      const rainfallDef = CLIMATE_PRODUCTS[0];
      const config = generateDiffChartConfig([], [], rainfallDef);
      expect(config.data?.json).toEqual([]);
    });
  });
});
