import { hackConvertStationDataForDisplay } from './climate.utils';

describe('climate.utils', () => {
  describe('hackConvertStationDataForDisplay', () => {
    it('should sort merged data by year', () => {
      const mockStationData = {
        // Simulating the user's scenario:
        // Temperature data starts early (e.g. 1947), Rainfall starts later (e.g. 1960)
        // mergeArraysByKey might preserve insertion order of the first array (Rainfall),
        // then append the rest of Temperature.
        // We want to ensure the final result is 1947, 1948... 1960...

        annual_rainfall_data: [
          { year: 1960, seasonal_rain: 100 },
          { year: 1961, seasonal_rain: 110 },
        ],
        annual_temperature_data: [
          { year: 1947, mean_tmax: 30 },
          { year: 1960, mean_tmax: 31 },
          { year: 1961, mean_tmax: 32 },
        ],
      } as any;

      const result = hackConvertStationDataForDisplay(mockStationData);

      expect(result.length).toBe(3);
      expect(result[0].Year).toBe(1947);
      expect(result[1].Year).toBe(1960);
      expect(result[2].Year).toBe(1961);
    });
  });
});
