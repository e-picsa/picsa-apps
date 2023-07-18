import { COLLECTION_V1, ENTRY_TEMPLATE_V1, IBudgetCard_v1, SCHEMA_V1 } from './schema_v1';
export * from './common';

// Re-export schema to provide latest version without need to refactor additonal code

export const COLLECTION = COLLECTION_V1;
export type IBudgetCard = IBudgetCard_v1;
export const SCHEMA = SCHEMA_V1;
export const ENTRY_TEMPLATE = ENTRY_TEMPLATE_V1;
