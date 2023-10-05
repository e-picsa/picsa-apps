import * as schema from './schema_v0';

// Re-export schema to provide latest version without need to refactor additonal code

export const FILES_COLLECTION = schema.COLLECTION_V0;
export type IResourceFile = schema.IResourceFile_v0;
export const FILES_SCHEMA = schema.SCHEMA_V0;
