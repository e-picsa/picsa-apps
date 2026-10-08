import type { IStationData } from '@picsa/models';
import { convertStationSummariesToRows } from '@picsa/utils';

import { IAnnualRainfallSummariesData, IAnnualTemperatureSummariesData, IClimateStationData } from './types';

/**
 * Merge multiple climate summaries from db record and refactor to format expected within legacy
 * app chart interface
 *
 * @param stationData
 * @returns
 */
export function hackConvertStationDataForDisplay(stationData: IClimateStationData['Row']): IStationData[] {
  if (!stationData) return [];
  const { annual_rainfall_data, annual_temperature_data } = stationData;
  return convertStationSummariesToRows(
    annual_rainfall_data as IAnnualRainfallSummariesData[],
    annual_temperature_data as IAnnualTemperatureSummariesData[],
  );
}
