import { Injectable, signal } from '@angular/core';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import {
  IStorageEntry,
  SupabaseStorageService,
} from '@picsa/shared/services/core/supabase/services/supabase-storage.service';
import { arrayToHashmap } from '@picsa/utils';

export interface IDashboardStorageEntry extends IStorageEntry {
  name: string;
  /** Url generated when upload to public bucket (will always be populated, even if bucket not public) */
  publicUrl: string;
}

/**
 * The dashboard storage service provides a caching layer between the supabase storage service and
 * dashboard components, to allow easier retrieval of storage items
 */
@Injectable({ providedIn: 'root' })
export class DashboardStorageService extends PicsaAsyncService {
  /** List of files available globally or to deployment-country bucket */
  public storageHashmap = signal<Record<string, IDashboardStorageEntry>>({});

  public storageList = signal<IDashboardStorageEntry[]>([]);

  constructor(private storageService: SupabaseStorageService) {
    super();
  }

  public override async init() {
    await this.storageService.ready();
    const files = await this.listStorageEntries();
    // Ensure active deployment loaded and list all files available either to deployment country or globally
    this.storageList.set(files);
    this.storageHashmap.set(arrayToHashmap(files, 'name'));
  }

  /** Retrieve storage db meta for a file */
  public async getStorageFileByPath(path: string) {
    await this.ready();
    // HACK - service does not receive updates if new uploads added so try fetch if missing
    if (!this.storageHashmap()[path]) {
      await this.refreshEntry(path);
    }
    return this.storageHashmap()[path];
  }

  /** Retrieve latest storage data from the server for a given path */
  private async refreshEntry(path: string) {
    const hashmap = this.storageHashmap();
    const [bucketId, namePath] = path.split('/');
    const [entry] = await this.storageService.list(bucketId, namePath);
    // entry updated
    if (entry) {
      hashmap[path] = this.addEntryMeta(entry);
    }
    // entry removed or missing
    else {
      delete hashmap[path];
    }
    this.storageHashmap.set(hashmap);
    this.storageList.set(Object.values(hashmap));
  }

  private async listStorageEntries() {
    // list all files across all buckets (some deployments may still read files from others)
    const bucketFiles = await this.storageService.list();
    const storageEntries: IDashboardStorageEntry[] = bucketFiles.map((entry) => this.addEntryMeta(entry));
    return storageEntries;
  }

  private addEntryMeta(entry: IStorageEntry): IDashboardStorageEntry {
    return {
      ...entry,
      name: `${entry.bucket_id}/${entry.name}`,
      // TODO - possibly only populate public urls here (and not in service)
      publicUrl: this.storageService.getPublicLink(entry.bucket_id as string, entry.name as string),
    };
  }
}
