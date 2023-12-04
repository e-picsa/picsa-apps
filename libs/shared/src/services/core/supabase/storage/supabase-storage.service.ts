import { Injectable } from '@angular/core';
import { FileObject, SearchOptions } from '@supabase/storage-js';
import { SupabaseClient } from '@supabase/supabase-js';

import { PicsaNotificationService } from '../../notification.service';

/**
 * Utility class for interacting with supabase storage client
 **/
@Injectable({ providedIn: 'root' })
export class SupabaseStorageService {
  private supabaseClient: SupabaseClient;

  constructor(private notificationService: PicsaNotificationService) {}

  private get storage() {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not registered in storage');
    }
    return this.supabaseClient.storage;
  }

  public registerSupabaseClient(client: SupabaseClient) {
    this.supabaseClient = client;
  }

  /**
   * List a bucket contents
   * Uses custom table view as by default js sdk appears to only return top-level files/folders
   * and not recursive children
   * Requires custom view created (see example resources migration)
   * */
  public async list(bucketId: string) {
    // NOTE - access via storage table instead of storage api as does not support recursive list
    const { data, error } = await this.supabaseClient.from(`storage_objects`).select('*').eq('bucket_id', bucketId);

    if (error) {
      console.error(error);
      this.notificationService.showUserNotification({ matIcon: 'error', message: error.message });
    }
    return data || [];
  }

  public async getFile(options: {
    bucketId: string;
    filename: string;
    folderPath?: string;
  }): Promise<FileObject | null> {
    const defaults = { folderPath: '' };
    const { bucketId, filename, folderPath } = { ...defaults, ...options };
    const { data, error } = await this.storage.from(bucketId).list(folderPath, { limit: 1, search: filename });
    if (error) {
      throw error;
    }
    return data?.[0] || null;
  }
}

/**
 * WiP
 * Currently most API methods seem to not be passing auth credentials as expected
 * Need to determine whether issue in local code/config or with supabase itself
 * Existing workaround handles upload via xhr requests in uploader component
 *
 * TODO - check config toml if can be updated to provide right urls, or perhaps
 * some setting needs to be enabled in supabase-js for local paths?
 * Should also try via insomnia
 *
 * https://github.com/supabase/storage/issues?q=local
 *
 * https://github.com/supabase/supabase-js/issues?q=storage
 */

// private async getBucket(bucketId: string = 'default'): Promise<Bucket> {
//   const { data, error } = await this.storage.getBucket(bucketId);

//   console.log(`getBucket ${bucketId}`, { data, error });
//   if (error) {
//     if (error?.message === 'Bucket not found') {
//       this.notificationService.showUserNotification({
//         matIcon: 'error',
//         message: `[${bucketId}] Storage bucket not available`,
//       });
//     }

//     throw error;
//   }

//   return data;
// }

// private async createBucket(id: string) {
//   const { data, error } = await this.storage.createBucket(id);
//   console.log('create bucket', { id, data, error });
// }

// TODO - make buckets private but add RLS for authenticated user
// https://supabase.com/docs/guides/storage/security/access-control
