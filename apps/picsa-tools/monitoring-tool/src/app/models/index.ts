import { ISupabasePushEntry } from '@picsa/shared/services/core/db_v2/db-supabase-push.service';

export const STATUS_ICONS: {
  [status in ISupabasePushEntry['_supabase_push_status']]: {
    matIcon: string;
  };
} = {
  complete: { matIcon: 'task_alt' },
  ready: { matIcon: 'upload_file' },
  draft: { matIcon: 'edit' },
  failed: { matIcon: 'error' },
};
