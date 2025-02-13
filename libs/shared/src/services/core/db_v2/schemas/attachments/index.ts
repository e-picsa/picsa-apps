import * as schema from './schema_V1';

// Re-export schema to provide latest version without need to refactor additonal code

export const ATTACHMENTS_COLLECTION = schema.COLLECTION_V1;
export type IAttachment = schema.IAttachment_V1;
export const ATTACHMENTS_SCHEMA = schema.SCHEMA_V1;
