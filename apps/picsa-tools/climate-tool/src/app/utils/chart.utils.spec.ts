import { IChartMeta, IStationData } from '@picsa/models';

import { calculateDataRanges, generateChartConfig, isTemperatureChart } from './chart.utils';

describe('chart.utils', () => {
  const mockTempMinMeta: IChartMeta = {
    _id: 'temp_min',
    name: 'Minimum Temperature',
    keys: ['min_tmin', 'mean_tmin'],
    units: '°C',
    xVar: 'Year',
    axes: {
      xMin: null,
      xMax: null,
      yMin: null,
      yMax: null,
      xMajor: 5,
      xMinor: 1,
      yMajor: 2,
      yMinor: 1,
    },
    colors: ['blue', 'cyan'],
  };

  const mockTempMaxMeta: IChartMeta = {
    _id: 'temp_max',
    name: 'Maximum Temperature',
    keys: ['mean_tmax', 'max_tmax'],
    units: '°C',
    xVar: 'Year',
    axes: {
      xMin: null,
      xMax: null,
      yMin: null,
      yMax: null,
      xMajor: 5,
      xMinor: 1,
      yMajor: 2,
      yMinor: 1,
    },
    colors: ['orange', 'red'],
  };

  const mockAnnualData: IStationData[] = [
    {
      Year: 2000,
      min_tmin: 4.2,
      mean_tmin: 16.5,
      max_tmin: 27.8, // Should NOT expand temp_min axis
      min_tmax: 15.2, // Should NOT expand temp_max axis
      mean_tmax: 27.0,
      max_tmax: 38.4,
    } as any,
    {
      Year: 2001,
      min_tmin: 6.0,
      mean_tmin: 18.0,
      max_tmin: 28.5,
      min_tmax: 16.0,
      mean_tmax: 29.5,
      max_tmax: 40.1,
    } as any,
  ];

  describe('isTemperatureChart', () => {
    it('should correctly identify temperature chart definitions by ID and units', () => {
      expect(isTemperatureChart(mockTempMinMeta)).toBe(true);
      expect(isTemperatureChart(mockTempMaxMeta)).toBe(true);
      expect(isTemperatureChart({ ...mockTempMinMeta, _id: 'custom_temp' as any, units: '°C' })).toBe(true);
      expect(isTemperatureChart({ ...mockTempMinMeta, _id: 'rainfall' as any, units: 'mm' })).toBe(false);
    });
  });

  describe('calculateDataRanges', () => {
    it('should snap temp_min to the nearest major gridline interval without using max_tmin', () => {
      // Annual min_tmin min is 4.2, mean_tmin max is 18.0.
      // Snapped to yMajor (2):
      // yMin: floor(4.2 / 2) * 2 = 4
      // yMax: ceil(18.0 / 2) * 2 = 18
      // If max_tmin (28.5) was used, yMax would be ceil(28.5 / 2) * 2 = 30.
      const ranges = calculateDataRanges(mockAnnualData, mockTempMinMeta);

      expect(ranges.yMin).toBe(4);
      expect(ranges.yMax).toBe(18);
    });

    it('should snap temp_max to the nearest major gridline interval without using min_tmax', () => {
      // Annual mean_tmax min is 27.0, max_tmax max is 40.1.
      // Snapped to yMajor (2):
      // yMin: floor(27.0 / 2) * 2 = 26
      // yMax: ceil(40.1 / 2) * 2 = 42
      // If min_tmax (15.2) was used, yMin would be floor(15.2 / 2) * 2 = 14.
      const ranges = calculateDataRanges(mockAnnualData, mockTempMaxMeta);

      expect(ranges.yMin).toBe(26);
      expect(ranges.yMax).toBe(42);
    });

    it('should correctly scale non-temperature charts to their major gridlines', () => {
      const rainfallMeta: IChartMeta = {
        _id: 'rainfall',
        name: 'Rainfall',
        keys: ['Rainfall'],
        units: 'mm',
        xVar: 'Year',
        axes: {
          xMin: null,
          xMax: null,
          yMin: 0,
          yMax: null,
          xMajor: 5,
          xMinor: 1,
          yMajor: 50,
          yMinor: 10,
        },
        colors: ['blue'],
      };
      const rainData: IStationData[] = [
        { Year: 2000, Rainfall: 540 } as any,
        { Year: 2001, Rainfall: 720 } as any,
      ];

      const ranges = calculateDataRanges(rainData, rainfallMeta);
      expect(ranges.yMin).toBe(0);
      expect(ranges.yMax).toBe(750); // ceil(720 / 50) * 50 = 750
    });

    it('should handle empty or all-null datasets gracefully without producing NaN or Infinity', () => {
      const emptyRanges = calculateDataRanges([], mockTempMinMeta);
      expect(Number.isFinite(emptyRanges.yMin)).toBe(true);
      expect(Number.isFinite(emptyRanges.yMax)).toBe(true);
      expect(Number.isFinite(emptyRanges.xMin)).toBe(true);
      expect(Number.isFinite(emptyRanges.xMax)).toBe(true);

      const nullData: IStationData[] = [
        { Year: 2000, min_tmin: null, mean_tmin: undefined } as any,
      ];
      const nullRanges = calculateDataRanges(nullData, mockTempMinMeta);
      expect(Number.isFinite(nullRanges.yMin)).toBe(true);
      expect(Number.isFinite(nullRanges.yMax)).toBe(true);
    });

    it('should preserve explicitly configured axis limits even if they are not multiples of yMajor', () => {
      const explicitMeta: IChartMeta = {
        ...mockTempMinMeta,
        axes: {
          ...mockTempMinMeta.axes,
          yMin: 3, // Not a multiple of yMajor (2)
          yMax: 25, // Not a multiple of yMajor (2)
          xMin: 1983, // Not a multiple of xMajor (5)
        },
      };

      const ranges = calculateDataRanges(mockAnnualData, explicitMeta);
      expect(ranges.yMin).toBe(3);
      expect(ranges.yMax).toBe(25);
      expect(ranges.xMin).toBe(1983);
    });

    it('should safely handle zero or missing yMajor without dividing by zero or producing NaN', () => {
      const zeroMajorMeta: IChartMeta = {
        ...mockTempMinMeta,
        axes: {
          ...mockTempMinMeta.axes,
          yMajor: 0,
          xMajor: 0,
        },
      };

      const ranges = calculateDataRanges(mockAnnualData, zeroMajorMeta);
      expect(Number.isFinite(ranges.yMin)).toBe(true);
      expect(Number.isFinite(ranges.yMax)).toBe(true);
      expect(Number.isFinite(ranges.xMin)).toBe(true);
      expect(Number.isFinite(ranges.xMax)).toBe(true);
    });
  });

  describe('generateChartConfig', () => {
    it('should use boundsData to fix scale to annual values when viewing timespan variation data', async () => {
      const monthlyData: IStationData[] = [
        { Year: 2000, min_tmin: 8.0, mean_tmin: 15.0 } as any,
        { Year: 2001, min_tmin: 9.0, mean_tmin: 16.0 } as any,
      ];

      // Pass monthlyData as data, but mockAnnualData as boundsData
      const metaCopy = { ...mockTempMinMeta, axes: { ...mockTempMinMeta.axes } };
      const config = await generateChartConfig(monthlyData, metaCopy, undefined, mockAnnualData);

      // Should have same yMin and yMax as annual calculation (4 to 18) rather than monthly bounds (8 to 16)
      expect(config.axis?.y?.min).toBe(4);
      expect(config.axis?.y?.max).toBe(18);
    });

    it('should not mutate the input definition axes object', async () => {
      const originalAxes = { ...mockTempMinMeta.axes };
      const metaToTest: IChartMeta = {
        ...mockTempMinMeta,
        axes: { ...originalAxes },
      };

      await generateChartConfig(mockAnnualData, metaToTest);

      // definition.axes.yMin / yMax should remain null in the passed definition
      expect(metaToTest.axes.yMin).toBeNull();
      expect(metaToTest.axes.yMax).toBeNull();
    });
  });
});
