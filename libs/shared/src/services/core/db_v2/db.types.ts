/**
 * List of collection names available within the apps
 * Any new collections should be named here to help db migration scripts
 */
const DB_COLLECTION_NAMES = [
  'attachments',
  'budget_cards',
  'forecasts',
  'monitoring_tool_forms',
  'monitoring_tool_submissions',
  'options_tool',
  'photos',
  'resources_tool_collections',
  'resources_tool_files',
  'resources_tool_links',
  'seasonal_calendar_tool',
  'sync_delete',
  'video_player',
] as const;

export type IDBCollectionName = (typeof DB_COLLECTION_NAMES)[number];
