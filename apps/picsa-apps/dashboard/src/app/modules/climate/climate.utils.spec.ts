import { extractStationGenerationMetadata, hackConvertStationDataForDisplay } from './climate.utils';

describe('climate.utils', () => {
  describe('extractStationGenerationMetadata', () => {
    it('should return empty object when stationData is null or undefined', () => {
      expect(extractStationGenerationMetadata(null)).toEqual({});
      expect(extractStationGenerationMetadata(undefined)).toEqual({});
    });

    it('should extract generation_timestamp and generation_id from annual_rainfall_metadata', () => {
      const mockData = {
        updated_at: '2026-10-19T12:00:00Z',
        annual_rainfall_metadata: {
          generation_timestamp: '2024-10-14T08:00:00Z',
          generation_id: 'zm-2024-v2-d8f9',
        },
      } as any;
      expect(extractStationGenerationMetadata(mockData)).toEqual({
        generation_timestamp: '2024-10-14T08:00:00Z',
        generation_id: 'zm-2024-v2-d8f9',
      });
    });

    it('should extract from secondary metadata candidate if rainfall metadata is missing', () => {
      const mockData = {
        updated_at: '2026-10-19T12:00:00Z',
        annual_temperature_metadata: {
          generation_timestamp: '2024-10-14T08:00:00Z',
          generation_id: 'zm-temp-v1',
        },
      } as any;
      expect(extractStationGenerationMetadata(mockData)).toEqual({
        generation_timestamp: '2024-10-14T08:00:00Z',
        generation_id: 'zm-temp-v1',
      });
    });

    it('should not fallback to updated_at when generation metadata is absent', () => {
      const mockData = {
        updated_at: '2026-10-19T12:00:00Z',
        annual_rainfall_metadata: {},
      } as any;
      expect(extractStationGenerationMetadata(mockData)).toEqual({});
    });
  });

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
