import { ClimateApi, Database } from '@picsa/server-types';

export * from './db';

// Re-export specific API Types
type schemas = ClimateApi.components['schemas'];
export type IAnnualRainfallSummariesData = schemas['AnnualRainfallSummariesdata'];
export type IAnnualRainfallSummariesMetadata = schemas['AnnualRainfallSummariesMetadata'];

export type IAnnualTemperatureSummariesData = schemas['AnnualTempartureSummariesdata'];
export type IAnnualTemperatureSummariesMetadata = schemas['TemperatureSummariesMetadata'];

export type IAPICountryCode = schemas['StationDataResponce']['country_code'];

export type ICropSuccessEntry = schemas['CropSuccessProbabilitiesdata'];

export type ForecastType = Database['public']['Enums']['forecast_type'];
