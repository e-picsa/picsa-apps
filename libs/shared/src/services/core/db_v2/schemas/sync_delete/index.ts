import * as schema from './schema_v0';

// Re-export schema to provide latest version without need to refactor additonal code

export const SYNC_DELETE_COLLECTION = schema.COLLECTION_V0;
export type ISyncDeleteEntry = schema.ISyncDelete_V0;
export const SYNC_DELETE_SCHEMA = schema.SCHEMA_V0;
