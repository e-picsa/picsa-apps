import { IStationData } from '@picsa/models/src';

import { IAnnualRainfallSummariesData } from '../../../../types';

// TODO - refactor components to use modern format
export function hackConvertAPIDataToLegacyFormat(apiData: IAnnualRainfallSummariesData[] = []) {
  const data: Partial<IStationData>[] = apiData.map((el) => ({
    Year: el.year,
    // HACK - use either end_rains or end_season depending on which has data populated
    // TODO - push for single value to be populated at api level
    End: el.end_rains_doy || el.end_season_doy,
    // HACK - extreme events not currently supported
    // Extreme_events: null as any,
    Length: el.season_length,
    // HACK - replace 0mm with null value
    // HACK - mw uses seasonal_rain but zm uses annual_rainfall - API should return consistent
    Rainfall: el.seasonal_rain || el.annual_rain || undefined,
    Start: el.start_rains_doy,
  }));
  return data;
}
