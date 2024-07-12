import { Injectable, signal } from '@angular/core';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import {
  IStorageEntry,
  SupabaseStorageService,
} from '@picsa/shared/services/core/supabase/services/supabase-storage.service';
import { arrayToHashmap } from '@picsa/utils';

import { DeploymentDashboardService } from '../../deployment/deployment.service';

export interface IDashboardStorageEntry extends IStorageEntry {
  name: string;
  /** Url generated when upload to public bucket (will always be populated, even if bucket not public) */
  publicUrl: string;
}

/**
 * Utility methods to support interaction with supabase storage for dashboard-specific context
 * This includes providing access to files specifically available to the active deployment
 */
@Injectable({ providedIn: 'root' })
export class DashboardStorageService extends PicsaAsyncService {
  /** List of files available globally or to deployment-country bucket */
  public storageHashmap = signal<Record<string, IDashboardStorageEntry>>({});

  public storageList = signal<IDashboardStorageEntry[]>([]);

  constructor(private deploymentService: DeploymentDashboardService, private storageService: SupabaseStorageService) {
    super();
  }

  public override async init() {
    await this.storageService.ready();
    // Ensure active deployment loaded and list all files available either to deployment country or globally
    const deployment = await this.deploymentService.ensureActiveDeployment();
    const countryFiles = await this.listStorageFiles(deployment.country_code);
    const globalFiles = await this.listStorageFiles('global');
    const combinedStorageFiles = globalFiles.concat(countryFiles);
    this.storageList.set(combinedStorageFiles);
    this.storageHashmap.set(arrayToHashmap(combinedStorageFiles, 'name'));
  }

  /** Retrieve storage db meta for a file */
  public async getStorageFileById(id: string) {
    await this.ready();
    return this.storageHashmap()[id];
  }

  private async listStorageFiles(bucket_id: string) {
    const bucketFiles = await this.storageService.list(bucket_id);
    const storageFiles: IDashboardStorageEntry[] = bucketFiles.map((file) => ({
      ...file,
      name: `${bucket_id}/${file.name}`,
      publicUrl: this.storageService.getPublicLink(file.bucket_id as string, file.name as string),
    }));
    return storageFiles;
  }
}
