import * as schema from './schema_v0';

// Re-export schema to provide latest version without need to refactor additonal code

export const COLLECTION = schema.COLLECTION_V0;
export type IVideoPlayerEntry = schema.IVideoPlayerEntry_V0;
export const SCHEMA = schema.SCHEMA_V0;

// Ensure blank templates always recreated from scratch
export const ENTRY_TEMPLATE = schema.ENTRY_TEMPLATE_V0;

export const COLLECTION_NAME = 'video_player';
