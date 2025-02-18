import * as schema from './schema_v0';

// Re-export schema to provide latest version without need to refactor additonal code

export const ATTACHMENTS_COLLECTION = schema.COLLECTION_V0;
export type IAttachment = schema.IAttachment_V0;
export const ATTACHMENTS_SCHEMA = schema.SCHEMA_V0;
