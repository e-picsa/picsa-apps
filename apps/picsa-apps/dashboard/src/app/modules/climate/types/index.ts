import * as APITypes from './api';
export * from './db';

// Re-export specific API Types
type schemas = APITypes.components['schemas'];
export type IAnnualRainfallSummariesData = schemas['AnnualRainfallSummariesdata'];
export type IAnnualRainfallSummariesMetadata = schemas['AnnualRainfallSummariesMetadata'];

export type IAPICountryCode = schemas['StationDataResponce']['country_code'];
