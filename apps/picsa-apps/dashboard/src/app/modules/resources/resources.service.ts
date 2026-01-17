import { computed, effect, inject,Injectable, signal } from '@angular/core';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { arrayToHashmap, arrayToHashmapArray } from '@picsa/utils';

import { DeploymentDashboardService } from '../deployment/deployment.service';
import { DashboardStorageService } from '../storage';
import { IResourceCollectionRow, IResourceFileChildRow, IResourceFileRow, IResourceLinkRow } from './types';

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

  constructor() {
    const deploymentService = inject(DeploymentDashboardService);

    super();
    effect(async () => {
      const countryCode = deploymentService.activeDeploymentCountry();
      if (countryCode) {
        await this.listResources(countryCode);
      }
    });
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
      const { data, error } = await table
        .select('*')
        .in('country_code', [countryCode as any, 'global'])
        .order('created_at');
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
