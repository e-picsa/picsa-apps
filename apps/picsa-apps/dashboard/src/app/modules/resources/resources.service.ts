import { Injectable, signal } from '@angular/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import {
  IStorageEntry,
  SupabaseStorageService,
} from '@picsa/shared/services/core/supabase/services/supabase-storage.service';
import { arrayToHashmap } from '@picsa/utils';

import { IResourceCollectionRow, IResourceFileChildRow, IResourceFileRow, IResourceLinkRow } from './types';

export interface IResourceStorageEntry extends IStorageEntry {
  /** Url generated when upload to public bucket (will always be populated, even if bucket not public) */
  publicUrl: string;
}

@Injectable({ providedIn: 'root' })
export class ResourcesDashboardService extends PicsaAsyncService {
  private storageFiles: IResourceStorageEntry[] = [];
  public storageFilesHashmap: Record<string, IResourceStorageEntry> = {};

  public resources = {
    collections: signal<IResourceCollectionRow[]>([]),
    files: signal<IResourceFileRow[]>([]),
    files_child: signal<IResourceFileChildRow[]>([]),
    links: signal<IResourceLinkRow[]>([]),
  };
  public get tables() {
    return {
      collections: this.supabaseService.db.table('resource_collections'),
      files: this.supabaseService.db.table('resource_files'),
      files_child: this.supabaseService.db.table('resource_files_child'),
      links: this.supabaseService.db.table('resource_links'),
    };
  }

  constructor(
    private supabaseService: SupabaseService,
    private storageService: SupabaseStorageService,
    private notificationService: PicsaNotificationService
  ) {
    super();
  }

  public override async init() {
    await this.supabaseService.ready();
    await this.storageService.ready();
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

  private async listStorageFiles() {
    const storageFiles = await this.storageService.list('resources');
    this.storageFiles = storageFiles.map((file) => ({
      ...file,
      publicUrl: this.storageService.getPublicLink(file.bucket_id as string, file.name as string),
    }));
    this.storageFilesHashmap = arrayToHashmap(this.storageFiles, 'id');
    console.log('storage files', this.storageFilesHashmap);
  }

  private async listResources() {
    const promises = Object.entries(this.tables).map(async ([name, table]) => {
      const { data, error } = await table.select('*');
      if (error) {
        console.error(error);
        this.notificationService.showUserNotification({ matIcon: 'error', message: error.message });
      }
      this.resources[name].set(data);
    });
    await Promise.all(promises);
  }
}
