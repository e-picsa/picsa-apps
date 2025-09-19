import * as APITypes from './api';
export * from './db';

// Re-export specific API Types
type schemas = APITypes.components['schemas'];
export type IAnnualRainfallSummariesData = schemas['AnnualRainfallSummariesdata'];
export type IAnnualRainfallSummariesMetadata = schemas['AnnualRainfallSummariesMetadata'];

export type IAnnualTemperatureSummariesData = schemas['AnnualTempartureSummariesdata'];
export type IAnnualTemperatureSummariesMetadata = schemas['TemperatureSummariesMetadata'];

export type IAPICountryCode = schemas['StationDataResponce']['country_code'];

export type ICropSuccessEntry = schemas['CropSuccessProbabilitiesdata'];
