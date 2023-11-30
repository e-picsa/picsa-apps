import { Injectable } from '@angular/core';
import { Bucket } from '@supabase/storage-js';
import { SupabaseClient } from '@supabase/supabase-js';

import { PicsaNotificationService } from '../../notification.service';

/** Utility class for interacting with supabase storage client */
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

  public async upload(bucketId: string) {
    const bucketRef = this.supabaseClient.storage.from('resources');

    const bucket = await this.getBucket(bucketId);

    console.log('bucket', bucket);
    console.log({ bucketId });
    return this.storage.from(bucketId);
  }

  private async getBucket(bucketId: string = 'default'): Promise<Bucket> {
    const { data, error } = await this.storage.getBucket(bucketId);

    console.log(`getBucket ${bucketId}`, { data, error });
    if (error) {
      if (error?.message === 'Bucket not found') {
        this.notificationService.showUserNotification({
          matIcon: 'error',
          message: `[${bucketId}] Storage bucket not available`,
        });
      }

      throw error;
    }

    return data;
  }

  private async createBucket(id: string) {
    const { data, error } = await this.storage.createBucket(id);
    console.log('create bucket', { id, data, error });
  }
}

// TODO - make buckets private but add RLS for authenticated user
// https://supabase.com/docs/guides/storage/security/access-control
