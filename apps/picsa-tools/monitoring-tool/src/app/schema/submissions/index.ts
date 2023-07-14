import { COLLECTION_V1, ENTRY_TEMPLATE_V1, IFormSubmission_v1, SCHEMA_V1 } from './schema_v1';

// Re-export schema to provide latest version without need to refactor additonal code

export const COLLECTION = COLLECTION_V1;
export type IFormSubmission = IFormSubmission_v1;
export const SCHEMA = SCHEMA_V1;
export const ENTRY_TEMPLATE = ENTRY_TEMPLATE_V1;