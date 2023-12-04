import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { Database } from '@picsa/server-types';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService, SupabaseUploadComponent } from '@picsa/shared/services/core/supabase';

import { DashboardMaterialModule } from '../../material.module';

type IStorageEntry = Database['storage']['Tables']['objects']['Row'];

@Component({
  selector: 'dashboard-resources-page',
  standalone: true,
  imports: [CommonModule, DashboardMaterialModule, SupabaseUploadComponent],
  templateUrl: './resources.page.html',
  styleUrls: ['./resources.page.scss'],
})
export class ResourcesPageComponent implements OnInit {
  private storageFiles: IStorageEntry[] = [];
  constructor(private supabaseService: SupabaseService, private notificationService: PicsaNotificationService) {}
  async ngOnInit() {
    await this.listResourcesByFolder();
    // TODO
    return;
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

  private async listResourcesByFolder() {
    const resources: IStorageEntry[] = await this.supabaseService.storage.list('resources');
    this.storageFiles = resources;
  }
}
