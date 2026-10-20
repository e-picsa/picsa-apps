import type { IStationData } from '@picsa/models';
import { convertStationSummariesToRows } from '@picsa/utils';

import { IAnnualRainfallSummariesData, IAnnualTemperatureSummariesData, IClimateStationData } from './types';

export interface IStationGenerationMetadata {
  generation_timestamp?: string;
  generation_id?: string;
}

/**
 * Extract generation timestamp and generation ID from station data product metadata.
 * Strictly extracts upstream generation metadata without falling back to DB write timestamp (updated_at).
 */
export function extractStationGenerationMetadata(
  stationData?: IClimateStationData['Row'] | null,
): IStationGenerationMetadata {
  if (!stationData) return {};
  const candidates = [
    stationData.annual_rainfall_metadata,
    stationData.annual_temperature_metadata,
    stationData.crop_probability_metadata,
    stationData.monthly_rainfall_metadata,
    stationData.monthly_temperature_metadata,
  ];
  for (const c of candidates) {
    const meta = c as { generation_timestamp?: string; generation_id?: string } | null | undefined;
    if (meta?.generation_timestamp || meta?.generation_id) {
      return {
        generation_timestamp: meta.generation_timestamp,
        generation_id: meta.generation_id,
      };
    }
  }
  return {};
}

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
