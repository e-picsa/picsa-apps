import { COLLECTION_V2, ENTRY_TEMPLATE_V2, IBudgetCard_V2, SCHEMA_V2 } from './schema_V2';
export * from './common';

// Re-export schema to provide latest version without need to refactor additonal code

export const COLLECTION = COLLECTION_V2;
export type IBudgetCard = IBudgetCard_V2;
export const SCHEMA = SCHEMA_V2;
export const ENTRY_TEMPLATE = ENTRY_TEMPLATE_V2;
