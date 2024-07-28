import * as schema from './schema_v0';

// Re-export schema to provide latest version without need to refactor additional code

export const COLLECTION = schema.PHOTO_COLLECTION_V0;
export type IPhotoEntry = schema.IPhotoEntry_V0;
export const SCHEMA = schema.PHOTO_SCHEMA_V0;

// Ensure blank templates always recreated from scratch
export const ENTRY_TEMPLATE = schema.PHOTO_ENTRY_TEMPLATE_V0;

export const COLLECTION_NAME = 'photos';
