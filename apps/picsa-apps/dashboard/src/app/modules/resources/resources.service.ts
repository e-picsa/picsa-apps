import { Injectable, signal } from '@angular/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Database } from '@picsa/server-types';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { arrayToHashmap } from '@picsa/utils';

export type IStorageEntry = Database['storage']['Tables']['objects']['Row'];
export type IResourceEntry = Database['public']['Tables']['resources']['Row'];

@Injectable({ providedIn: 'root' })
export class ResourcesDashboardService {
  private storageFiles: IStorageEntry[] = [];
  public storageFilesHashmap: Record<string, IStorageEntry> = {};
  public readonly resources = signal<IResourceEntry[]>([]);

  constructor(private supabaseService: SupabaseService, private notificationService: PicsaNotificationService) {
    this.initialise();
  }

  private async initialise() {
    await this.supabaseService.ready();
    await this.listStorageFiles();
    await this.listResources();
  }

  /**
   *
   * TODO - only enable super admin/local dev
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
      const { type, filename, id, description, url } = fileEntry;
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
    this.storageFiles = await this.supabaseService.storage.list('resources');
    this.storageFilesHashmap = arrayToHashmap(this.storageFiles, 'id');
    console.log('storage files', this.storageFilesHashmap);
  }

  private async listResources() {
    const { data, error } = await this.supabaseService.db.table('resources').select<'*', IResourceEntry>('*');
    if (error) {
      throw error;
    }
    this.resources.set(data);
  }
}
