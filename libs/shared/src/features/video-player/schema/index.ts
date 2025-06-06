import * as schema from './schema_v1';

// Re-export schema to provide latest version without need to refactor additonal code

export const COLLECTION = schema.COLLECTION_V1;
export type IVideoPlayerEntry = schema.IVideoPlayerEntry_V1;
export const SCHEMA = schema.SCHEMA_V1;

// Ensure blank templates always recreated from scratch
export const ENTRY_TEMPLATE = schema.ENTRY_TEMPLATE_V1;

export const COLLECTION_NAME = 'video_player';
