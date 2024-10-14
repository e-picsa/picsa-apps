import { IStationData } from '@picsa/models/src';

import { IAnnualRainfallSummariesData } from '../../../../types';

// TODO - refactor components to use modern format
export function hackConvertAPIDataToLegacyFormat(apiData: IAnnualRainfallSummariesData[] = []) {
  const data: IStationData[] = apiData.map((el) => {
    const entry: IStationData = {
      Year: undefined as any,
      Rainfall: undefined as any,
      Start: undefined as any,
      Length: undefined as any,
      End: undefined as any,
      Extreme_events: undefined as any,
    };
    const { year, end_rains_doy, end_season_doy, season_length, seasonal_rain, annual_rain, start_rains_doy } = el;
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

    return entry;
  });
  return data;
}
