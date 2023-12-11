import { Injectable, signal } from '@angular/core';
import { Database } from '@picsa/server-types';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { arrayToHashmap } from '@picsa/utils';

export type IStorageEntry = Database['storage']['Tables']['objects']['Row'];
export type IResourceEntry = Database['public']['Tables']['resources']['Row'];

/** Resource db entry with merged storage_file entry */
export interface IResource extends Omit<IResourceEntry, 'storage_file'> {
  storage_file?: IStorageEntry & { filename?: string };
}

@Injectable({ providedIn: 'root' })
export class ResourcesDashboardService {
  private storageFiles: IStorageEntry[] = [];
  private storageFilesHashmap: Record<string, IStorageEntry> = {};
  public readonly resources = signal<IResource[]>([]);

  constructor(private supabaseService: SupabaseService, private notificationService: PicsaNotificationService) {
    this.initialise();
  }

  private async initialise() {
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
    const uploaded: any[] = [];
    const missing: any[] = [];

    for (const fileEntry of Object.values(DB_FILE_ENTRIES)) {
      const { type, filename, id, description, url } = fileEntry;
      const storagePath = this.extractFirebaseStorageFolder(url);
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

  /**
   *
   */
  private extractFirebaseStorageFolder(url: string) {
    const { pathname } = new URL(url);
    return decodeURI(pathname).replace(/%2F/g, '/').replace('/v0/b/picsa-apps.appspot.com/o/', '');
  }

  private async listStorageFiles() {
    this.storageFiles = await this.supabaseService.storage.list('resources');
    this.storageFilesHashmap = arrayToHashmap(this.storageFiles, 'id');
    console.log('storage files', this.storageFilesHashmap);
  }

  /**
   *
   */
  private async listResources() {
    const { data, error } = await this.supabaseService.db.table('resources').select('*');
    if (error) {
      throw error;
    }
    const resources: IResource[] = data.map((entry: IResourceEntry) => {
      const { storage_file } = entry;
      const storageEntry = storage_file ? this.storageFilesHashmap[storage_file] : undefined;
      const filename = storageEntry?.name?.split('/').pop() || '';
      const resource: IResource = {
        ...entry,
        storage_file: { ...(storageEntry as IStorageEntry), filename },
      };
      return resource;
    });
    this.resources.set(resources);
    console.log('resources', this.resources);
  }
}
