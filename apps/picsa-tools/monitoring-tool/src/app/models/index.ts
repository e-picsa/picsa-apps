import { ISyncPushEntry } from '@picsa/shared/services/core/db_v2/db-sync.service';

export const STATUS_ICONS: {
  [status in ISyncPushEntry['_sync_push_status']]: {
    matIcon: string;
  };
} = {
  complete: { matIcon: 'task_alt' },
  ready: { matIcon: 'sync' },
  draft: { matIcon: 'edit' },
  failed: { matIcon: 'error' },
};
