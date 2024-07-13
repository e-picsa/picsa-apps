import { Injectable } from '@angular/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Database } from '@picsa/server-types';
import { FileObject, FileOptions } from '@supabase/storage-js';
import { SupabaseClient } from '@supabase/supabase-js';
import { firstValueFrom, Subject } from 'rxjs';

import { PicsaAsyncService } from '../../../asyncService.service';
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
type IStorageEntrySDK = FileObject;

/**
 * Utility class for interacting with supabase storage client
 **/
@Injectable({ providedIn: 'root' })
export class SupabaseStorageService extends PicsaAsyncService {
  private storage: SupabaseClient['storage'];
  private client: SupabaseClient;

  /** Track parent service registration */
  private register$ = new Subject<SupabaseClient>();

  constructor(private notificationService: PicsaNotificationService) {
    super();
  }

  public override async init(): Promise<void> {
    // wait for service to have supabase client registered (done in app module)
    if (!this.storage) {
      await firstValueFrom(this.register$);
    }
  }

  public registerSupabaseClient(client: SupabaseClient) {
    this.storage = client.storage;
    this.client = client;
    this.register$.next(client);
    this.register$.complete();
  }

  /**
   * List a bucket contents
   * Uses custom table view as by default js sdk appears to only return top-level files/folders
   * and not recursive children
   * Requires custom view created (see example resources migration)
   * @param subFolder - list all files within nested folder structure
   * */
  public async list(bucketId?: string, subfolder?: string) {
    // NOTE - access via storage table instead of storage api as does not support recursive list
    let query = this.client.from(`storage_objects`).select<'*', IStorageEntry>('*');
    if (bucketId) {
      query = query.eq('bucket_id', bucketId);
    }

    if (subfolder) {
      query = query.like('name', `${subfolder}/%`);
    }
    const { data, error } = await query;
    console.log('storage list', { bucketId, subfolder });
    if (error) {
      console.error(error);
      this.notificationService.showErrorNotification(error.message);
    }
    return data || [];
  }

  /**
   * List a single file using the data stored within the custom storage_objects database
   * @param storagePath - Fully qualified path to file, including bucket prefix
   */
  public async getFile(storagePath: string): Promise<IStorageEntry | null> {
    const [bucket_id, ...path_tokens] = storagePath.split('/');
    const { data, error } = await this.client
      .from(`storage_objects`)
      .select<'*', IStorageEntry>('*')
      .eq('bucket_id', bucket_id)
      .eq('name', path_tokens.join('/'))
      .limit(1);
    console.log('get file', { bucket_id, path_tokens, data, error });

    if (error) {
      throw error;
    }
    if (data && data.length > 0) {
      return data[0];
    }
    return null;
  }

  /**
   * Alt implementation to retrieve file meta using storage sdk
   * Previously required when using storage objects ids (not returned),
   * however now storage pathnames used instead so can likely deprecate/remove
   * https://github.com/orgs/supabase/discussions/4303
   **/
  public async getFileAlt(options: {
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

  public async putFile(
    options: { bucketId: string; filename: string; fileBlob: Blob; folderPath?: string },
    fileOptions: FileOptions = { upsert: false }
  ) {
    const defaults = { folderPath: '' };
    const { bucketId, fileBlob, filename, folderPath } = { ...defaults, ...options };
    const filePath = folderPath ? `${folderPath}/${filename}` : `${filename}`;
    const { data, error } = await this.storage.from(bucketId).upload(filePath, fileBlob, fileOptions);
    if (error) {
      throw error;
    }
    return data?.[0] || null;
  }

  public async deleteFile(bucketId: string, filePath: string) {
    return this.storage.from(bucketId).remove([filePath]);
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
