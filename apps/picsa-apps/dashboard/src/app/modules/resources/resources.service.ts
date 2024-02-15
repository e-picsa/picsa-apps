import { Injectable, signal } from '@angular/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Database } from '@picsa/server-types';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { IStorageEntry } from '@picsa/shared/services/core/supabase/services/supabase-storage.service';
import { arrayToHashmap } from '@picsa/utils';

import { IResourceRow } from '../climate/types';

export interface IResourceStorageEntry extends IStorageEntry {
  /** Url generated when upload to public bucket (will always be populated, even if bucket not public) */
  publicUrl: string;
}

@Injectable({ providedIn: 'root' })
export class ResourcesDashboardService extends PicsaAsyncService {
  private storageFiles: IResourceStorageEntry[] = [];
  public storageFilesHashmap: Record<string, IResourceStorageEntry> = {};
  public readonly resources = signal<IResourceRow[]>([]);

  public get table() {
    return this.supabaseService.db.table('resources');
  }

  constructor(private supabaseService: SupabaseService, private notificationService: PicsaNotificationService) {
    super();
  }

  public override async init() {
    await this.supabaseService.ready();
    await this.listStorageFiles();
    await this.listResources();
  }

  /** Retrieve storage db meta for a file */
  public async getStorageFileById(id: string) {
    // Refresh storage file cache if id not found
    if (!this.storageFilesHashmap[id]) {
      await this.listStorageFiles();
    }
    return this.storageFilesHashmap[id];
  }

  /**
   *
   * TODO - only enable super admin/local dev
   * TODO - remove when no longer required
   */
  public async migrateHardcodedResources() {
    // NOTE - assumes storage files manually uploaded

    // eslint-disable-next-line @nx/enforce-module-boundaries
    const { DB_COLLECTION_ENTRIES, DB_FILE_ENTRIES, DB_LINK_ENTRIES } = await import(
      '@picsa/resources/src/app/data/index'
    );
    console.log({ DB_COLLECTION_ENTRIES, DB_FILE_ENTRIES, DB_LINK_ENTRIES });
    const ref = this.supabaseService.db.table('resources');
    const uploaded: unknown[] = [];
    const missing: unknown[] = [];

    for (const fileEntry of Object.values(DB_FILE_ENTRIES)) {
      const { type, description, url } = fileEntry;
      // extract pathname from firebase url
      const { pathname } = new URL(url);
      const storagePath = decodeURI(pathname).replace(/%2F/g, '/').replace('/v0/b/picsa-apps.appspot.com/o/', '');
      // check for equivalent storage file
      const storageFile = this.storageFiles.find((file) => file.name === storagePath);
      if (storageFile) {
        const dbEntry: Database['public']['Tables']['resources']['Insert'] = {
          description,
          type,

          storage_file: storageFile.id,
        };
        const { error } = await ref.upsert(dbEntry, { ignoreDuplicates: false });

        if (error) {
          console.error(error);
        }
        uploaded.push(fileEntry);
      } else {
        missing.push(fileEntry);
      }
    }
    console.log({ uploaded, missing });
    if (missing.length > 0) {
      this.notificationService.showUserNotification({
        matIcon: 'error',
        message: `${missing.length} files missing from storage`,
      });
    }
  }

  private async listStorageFiles() {
    const storageFiles = await this.supabaseService.storage.list('resources');
    this.storageFiles = storageFiles.map((file) => ({
      ...file,
      publicUrl: this.supabaseService.storage.getPublicLink(file.bucket_id as string, file.name as string),
    }));
    this.storageFilesHashmap = arrayToHashmap(this.storageFiles, 'id');
    console.log('storage files', this.storageFilesHashmap);
  }

  private async listResources() {
    const { data, error } = await this.supabaseService.db.table('resources').select<'*', IResourceRow>('*');
    if (error) {
      throw error;
    }
    this.resources.set(data);
  }
}
