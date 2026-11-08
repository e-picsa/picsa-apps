import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { arrayToHashmap, arrayToHashmapArray } from '@picsa/utils';

import { DeploymentDashboardService } from '../deployment/deployment.service';
import { DashboardStorageService } from '../storage';
import {
  ICountryCode,
  IResourceCollectionRow,
  IResourceFileChildRow,
  IResourceFileRow,
  IResourceLinkRow,
} from './types';

@Injectable({ providedIn: 'root' })
export class ResourcesDashboardService extends PicsaAsyncService {
  private supabaseService = inject(SupabaseService);
  private storageService = inject(DashboardStorageService);
  private notificationService = inject(PicsaNotificationService);

  public collections = signal<IResourceCollectionRow[]>([]);
  public files = signal<IResourceFileRow[]>([]);
  public links = signal<IResourceLinkRow[]>([]);
  private files_child = signal<IResourceFileChildRow[]>([]);

  // Hashmap variants for lookup
  public collectionsById = computed(() => arrayToHashmap(this.collections(), 'id'));
  private filesById = computed(() => arrayToHashmap(this.files(), 'id'));
  private linksById = computed(() => arrayToHashmap(this.links(), 'id'));
  private filesChildByParentId = computed(() => arrayToHashmapArray(this.files_child(), 'resource_file_id'));

  /** list of all resources with array of collections each are a member of */
  private resourceCollectionMap = computed(() => {
    const collections = this.collections();
    return this.generateResourceCollectionMap(collections);
  });

  public get tables() {
    return {
      collections: this.supabaseService.db.table('resource_collections'),
      files: this.supabaseService.db.table('resource_files'),
      files_child: this.supabaseService.db.table('resource_files_child'),
      links: this.supabaseService.db.table('resource_links'),
    };
  }

  private deploymentService = inject(DeploymentDashboardService);

  constructor() {
    super();

    effect(async () => {
      const countryCode = this.deploymentService.activeDeploymentCountry();
      if (countryCode) {
        await this.listResources(countryCode);
      }
    });
  }

  public async refresh() {
    const countryCode = this.deploymentService.activeDeploymentCountry();
    if (countryCode) {
      await this.listResources(countryCode);
    }
  }

  public override async init() {
    await this.supabaseService.ready();
    await this.storageService.ready();
  }

  /** Retrieve all child resources with a given parent resource id */
  public getChildResources(resourceId: string) {
    return this.filesChildByParentId()[resourceId] || [];
  }

  /** Retrieve a list of all collections that a given resource is a member of */
  public getResourceCollections(type: 'collections' | 'links' | 'files', resourceId: string) {
    const collectionIds = this.resourceCollectionMap()[type][resourceId] || [];
    return collectionIds.map((id) => this.collectionsById()[id]);
  }

  private async listResources(countryCode: string) {
    // Load all resource tables
    const serverData = {
      collections: [] as IResourceCollectionRow[],
      files: [] as IResourceFileRow[],
      files_child: [] as IResourceFileChildRow[],
      links: [] as IResourceLinkRow[],
    };
    const promises = Object.entries(this.tables).map(async ([name, table]) => {
      // Strictly scope all resources (collections, files, links, child files) to active deployment country
      const query = table
        .select('*')
        .eq('country_code', countryCode as ICountryCode)
        .order('created_at');
      const { data, error } = await query;
      if (error) {
        throw new Error(error.message);
      }
      serverData[name] = data;
    });
    await Promise.all(promises);
    // Populate resources
    this.files.set(serverData.files);
    this.files_child.set(serverData.files_child);
    this.collections.set(serverData.collections);
    this.links.set(serverData.links);
  }

  /**
   * Delete a resource file and clean up underlying storage files from Supabase Storage.
   */
  public async deleteResourceFile(resource: IResourceFileRow) {
    const filesToDelete: { bucket: string; path: string }[] = [];

    if (resource.storage_file) {
      const [bucket, ...rest] = resource.storage_file.split('/');
      filesToDelete.push({ bucket, path: rest.join('/') });
    }

    if (resource.cover_image && !resource.cover_image.startsWith('global/images/placeholder')) {
      const [bucket, ...rest] = resource.cover_image.split('/');
      filesToDelete.push({ bucket, path: rest.join('/') });
    }

    for (const { bucket, path } of filesToDelete) {
      try {
        await this.supabaseService.storage.deleteFile(bucket, path);
      } catch (err) {
        console.warn(`[ResourcesDashboardService] Could not delete storage file ${bucket}/${path}:`, err);
      }
    }

    const res = await this.tables.files.delete().eq('id', resource.id);
    if (res.error) {
      throw new Error(res.error.message);
    }
    await this.refresh();
  }

  /**
   * Delete a resource link and clean up any uploaded cover image from Supabase Storage.
   */
  public async deleteResourceLink(resource: IResourceLinkRow) {
    if (resource.cover_image && !resource.cover_image.startsWith('global/images/placeholder')) {
      const [bucket, ...rest] = resource.cover_image.split('/');
      try {
        await this.supabaseService.storage.deleteFile(bucket, rest.join('/'));
      } catch (err) {
        console.warn(`[ResourcesDashboardService] Could not delete storage cover ${resource.cover_image}:`, err);
      }
    }

    const res = await this.tables.links.delete().eq('id', resource.id);
    if (res.error) {
      throw new Error(res.error.message);
    }
    await this.refresh();
  }

  /** Iterate over all collections and create list of resource ids and the collection ids they are members of */
  private generateResourceCollectionMap(collections: IResourceCollectionRow[]) {
    const resourceCollectionSummary: IResourceCollectionSummary = { links: {}, files: {}, collections: {} };
    function assignResourceCollection(
      type: 'links' | 'files' | 'collections',
      resourceId: string,
      collectionId: string,
    ) {
      if (!resourceCollectionSummary[type][resourceId]) {
        resourceCollectionSummary[type][resourceId] = [];
      }
      resourceCollectionSummary[type][resourceId].push(collectionId);
    }
    for (const { id: collectionId, resource_collections, resource_files, resource_links } of collections) {
      for (const resourceId of resource_collections || []) {
        assignResourceCollection('collections', resourceId, collectionId);
      }
      for (const resourceId of resource_files || []) {
        assignResourceCollection('files', resourceId, collectionId);
      }
      for (const resourceId of resource_links || []) {
        assignResourceCollection('links', resourceId, collectionId);
      }
    }
    return resourceCollectionSummary;
  }
}
interface IResourceCollectionSummary {
  links: { [resourceLinkId: string]: string[] };
  files: { [resourceFileId: string]: string[] };
  collections: { [resourceCollectionId: string]: string[] };
}
