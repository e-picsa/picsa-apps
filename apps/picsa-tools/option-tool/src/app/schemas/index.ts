import * as schema from './schema_v5';

// Re-export schema to provide latest version without need to refactor additonal code

export const COLLECTION = schema.COLLECTION_V5;
export type IOptionsToolEntry = schema.IOptionsToolEntry_v5;
export const SCHEMA = schema.SCHEMA_V5;

// Ensure blank templates always recreated from scratch
export const ENTRY_TEMPLATE = schema.ENTRY_TEMPLATE_V5;
