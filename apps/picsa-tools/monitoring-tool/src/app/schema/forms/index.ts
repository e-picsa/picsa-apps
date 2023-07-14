import { COLLECTION_V1, IMonitoringForm_v1, SCHEMA_V1 } from './schema_v1';

// Re-export schema to provide latest version without need to refactor additonal code

export const COLLECTION = COLLECTION_V1;
export type IMonitoringForm = IMonitoringForm_v1;
export const SCHEMA = SCHEMA_V1;