import type { IStationData } from '@picsa/models';
import { mergeArraysByKey } from '@picsa/utils';

import { IAnnualRainfallSummariesData, IAnnualTemperatureSummariesData, IClimateStationData } from './types';

/**
 * Merge multiple climate summaries from db record and refactor to format expected within legacy
 * app chart interface
 *
 * TODO - refactor charts to use columns from api data
 *
 * @param dbData
 * @returns
 */
export function hackConvertStationDataForDisplay(stationData: IClimateStationData['Row']): IStationData[] {
  if (!stationData) return [];
  const { annual_rainfall_data, annual_temperature_data } = stationData;
  const mergedData = mergeDataSummaries(annual_rainfall_data as any[], annual_temperature_data as any[]);

  const data: IStationData[] = mergedData.map((el) => {
    const { max_tmax, max_tmin, min_tmax, min_tmin, mean_tmax, mean_tmin } = el;
    const { year, end_rains_doy, end_season_doy, season_length, seasonal_rain, annual_rain, start_rains_doy } = el;

    const entry: IStationData = {
      Year: undefined as any,
      Start: undefined as any,
      End: undefined as any,
      Length: undefined as any,
      Rainfall: undefined as any,
      max_tmax,
      max_tmin,
      min_tmax,
      min_tmin,
      mean_tmax,
      mean_tmin,
      Extreme_events: undefined as any,
    };
    if (typeof year === 'number') entry.Year = year;
    // HACK - use either end_rains or end_season depending on which has data populated
    // TODO - push for single value to be populated at api level
    if (typeof end_rains_doy === 'number') entry.End = end_rains_doy;
    if (typeof end_season_doy === 'number') entry.End = end_season_doy;
    if (typeof start_rains_doy === 'number') entry.Start = start_rains_doy;
    if (typeof season_length === 'number') entry.Length = season_length;
    // HACK - replace 0mm with null value
    if (seasonal_rain) entry.Rainfall = seasonal_rain;
    // HACK - mw uses seasonal_rain but zm uses annual_rainfall - API should return consistent
    if (annual_rain) entry.Rainfall = annual_rain;

    return cleanEntry(entry);
  });
  return data;
}

function cleanEntry(entry: IStationData) {
  for (const [key, value] of Object.entries(entry)) {
    // round all temp values to 1dp
    if (key.includes('_t') && typeof value === 'number') {
      entry[key] = Math.round(value * 10) / 10;
    }
  }
  return entry;
}

function mergeDataSummaries(rainfall: IAnnualRainfallSummariesData[], temperature: IAnnualTemperatureSummariesData[]) {
  return mergeArraysByKey(rainfall ?? [], temperature ?? [], 'year');
}
