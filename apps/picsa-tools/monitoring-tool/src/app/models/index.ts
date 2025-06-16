import { ISyncPushEntry } from '@picsa/shared/services/core/db_v2/db-sync.service';

export type ISyncStatus = ISyncPushEntry['_sync_push_status'];

export const STATUS_ICONS: Record<ISyncStatus, string> = {
  complete: 'task_alt',
  ready: 'sync',
  draft: 'edit',
  failed: 'error',
};
