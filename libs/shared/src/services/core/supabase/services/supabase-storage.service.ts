import { Injectable } from '@angular/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Database } from '@picsa/server-types';
import { FileObject } from '@supabase/storage-js';
import { SupabaseClient } from '@supabase/supabase-js';

import { PicsaNotificationService } from '../../notification.service';

type IStorageDB = Database['storage']['Tables']['objects']['Row'];

/** DB entry populated to server storage objects with explicit metadata expected */
export interface IStorageEntry extends IStorageDB {
  metadata: {
    /** cacheControl will be altered from input metadata, e.g. `3600` -> `"max-age=3600"` */
    cacheControl: string;
    contentLength: number;
    eTag: string;
    httpStatusCode: number;
    lastModified: string;
    mimetype: string;
    size: number;
  };
}

/** Data populated when storage object retrieved via SDK (as opposed to storage table direct) */
export interface IStorageEntrySDK extends FileObject {}

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
  public async list(bucketId: string, folderPath?: string) {
    // NOTE - access via storage table instead of storage api as does not support recursive list
    let query = this.supabaseClient.from(`storage_objects`).select<'*', IStorageEntry>('*').eq('bucket_id', bucketId);

    if (folderPath) {
      query = query.like('name', `${folderPath}/%`);
    }
    const { data, error } = await query;

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
  }): Promise<IStorageEntrySDK | null> {
    const defaults = { folderPath: '' };
    const { bucketId, filename, folderPath } = { ...defaults, ...options };
    const { data, error } = await this.storage.from(bucketId).list(folderPath, { limit: 1, search: filename });
    if (error) {
      throw error;
    }
    return data?.[0] || null;
  }

  /** Return the link to a file in a public bucket */
  public getPublicLink(bucketId: string, objectPath: string) {
    return this.storage.from(bucketId).getPublicUrl(objectPath).data.publicUrl;
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
