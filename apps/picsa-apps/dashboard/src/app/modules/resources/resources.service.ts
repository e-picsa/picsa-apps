import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { arrayToHashmap, arrayToHashmapArray } from '@picsa/utils';

import { DeploymentDashboardService } from '../deployment/deployment.service';
import { DashboardStorageService } from '../storage';
import {
  ICountryCode,
  IResourceCollectionInsert,
  IResourceCollectionRow,
  IResourceFileChildRow,
  IResourceFileRow,
  IResourceLinkRow,
} from './types';

@Injectable({ providedIn: 'root' })
export class ResourcesDashboardService extends PicsaAsyncService {
  private supabaseService = inject(SupabaseService);
  private storageService = inject(DashboardStorageService);

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

  /** Unassigned files and links not currently assigned to any collection */
  public unassignedResources = computed(() => {
    const assignedFileIds = new Set<string>();
    const assignedLinkIds = new Set<string>();
    for (const col of this.collections()) {
      for (const fId of col.resource_files || []) assignedFileIds.add(fId);
      for (const lId of col.resource_links || []) assignedLinkIds.add(lId);
    }
    return {
      files: this.files().filter((f) => !assignedFileIds.has(f.id)),
      links: this.links().filter((l) => !assignedLinkIds.has(l.id)),
    };
  });

  /**
   * Save (create or update) a resource collection.
   * Enforces top-level collections (collection_parent = null, resource_collections = []).
   */
  public async saveCollection(values: Partial<IResourceCollectionRow>): Promise<IResourceCollectionRow> {
    const countryCode = values.country_code || this.deploymentService.activeDeploymentCountry();
    const payload: IResourceCollectionInsert = {
      title: values.title || '',
      description: values.description || null,
      cover_image: values.cover_image || null,
      country_code: countryCode as ICountryCode,
      collection_parent: null,
      resource_collections: [] as string[],
      resource_files: values.resource_files || [],
      resource_links: values.resource_links || [],
      ...(values.sort_order !== undefined ? { sort_order: values.sort_order } : {}),
    };

    const query = values.id
      ? this.tables.collections.update(payload).eq('id', values.id)
      : this.tables.collections.insert(payload);

    const { data, error } = await query.select<'*', IResourceCollectionRow>().single();

    if (error) {
      throw new Error(error.message);
    }

    await this.refresh();
    return data;
  }

  /**
   * Delete a resource collection and clean up its cover image if unreferenced.
   */
  public async deleteResourceCollection(collection: IResourceCollectionRow): Promise<void> {
    const res = await this.tables.collections.delete().eq('id', collection.id);
    if (res.error) {
      throw new Error(res.error.message);
    }

    if (collection.cover_image) {
      await this.deleteCoverIfUnreferenced(collection.cover_image);
    }

    await this.refresh();
  }

  /**
   * Synchronize the collections that reference a specific file or link.
   * Updates `resource_files` or `resource_links` on affected collections.
   */
  public async syncResourceCollections(
    type: 'files' | 'links',
    resourceId: string,
    targetCollectionIds: string[],
  ): Promise<void> {
    const targetSet = new Set(targetCollectionIds);
    const fieldName = type === 'files' ? 'resource_files' : 'resource_links';
    const collectionsToUpdate: { id: string; items: string[] }[] = [];

    for (const collection of this.collections()) {
      const currentItems: string[] = (collection[fieldName] as string[]) || [];
      const hasItem = currentItems.includes(resourceId);
      const shouldHave = targetSet.has(collection.id);

      if (shouldHave && !hasItem) {
        collectionsToUpdate.push({
          id: collection.id,
          items: [...currentItems, resourceId],
        });
      } else if (!shouldHave && hasItem) {
        collectionsToUpdate.push({
          id: collection.id,
          items: currentItems.filter((id) => id !== resourceId),
        });
      }
    }

    if (collectionsToUpdate.length > 0) {
      const results = await Promise.all(
        collectionsToUpdate.map((u) => {
          const updateData = type === 'files' ? { resource_files: u.items } : { resource_links: u.items };
          return this.tables.collections.update(updateData).eq('id', u.id);
        }),
      );
      const firstError = results.find((r) => r.error)?.error;
      if (firstError) {
        throw new Error(firstError.message);
      }
      await this.refresh();
    }
  }

  /**
   * Delete a resource file and clean up underlying storage files from Supabase Storage.
   * Deletes database row first to prevent orphaned records if RLS/DB fails, and guards
   * against deleting storage assets shared with other resources.
   */
  public async deleteResourceFile(resource: IResourceFileRow) {
    const res = await this.tables.files.delete().eq('id', resource.id);
    if (res.error) {
      throw new Error(res.error.message);
    }

    // Database row deleted first; now safely clean up storage assets if unreferenced
    if (resource.storage_file) {
      await this.deleteStorageFileIfUnreferenced(resource.storage_file);
    }
    if (resource.cover_image) {
      await this.deleteCoverIfUnreferenced(resource.cover_image);
    }

    await this.refresh();
  }

  /**
   * Delete a resource link and clean up any uploaded cover image from Supabase Storage.
   * Deletes database row first and verifies the cover image is not shared by other resources across any country.
   */
  public async deleteResourceLink(resource: IResourceLinkRow) {
    const res = await this.tables.links.delete().eq('id', resource.id);
    if (res.error) {
      throw new Error(res.error.message);
    }

    if (resource.cover_image) {
      await this.deleteCoverIfUnreferenced(resource.cover_image);
    }

    await this.refresh();
  }

  /** Delete a storage file only if no other resource files reference it and it is not in the global bucket */
  private async deleteStorageFileIfUnreferenced(storageFile: string) {
    const [bucket, ...rest] = storageFile.split('/');
    if (bucket === 'global') return;

    const { count, error } = await this.tables.files
      .select('id', { count: 'exact', head: true })
      .eq('storage_file', storageFile);

    // If query failed or references remain, preserve the storage object
    if (error || (count ?? 0) > 0) return;

    try {
      await this.supabaseService.storage.deleteFile(bucket, rest.join('/'));
    } catch (err) {
      console.warn(`[ResourcesDashboardService] Could not delete storage file ${storageFile}:`, err);
    }
  }

  /** Delete a cover image only if no files, links, or collections reference it and it is not in the global bucket */
  private async deleteCoverIfUnreferenced(coverImage: string) {
    if (coverImage.startsWith('global/')) return;
    const [bucket, ...rest] = coverImage.split('/');
    if (bucket === 'global') return;

    const [filesRes, linksRes, collectionsRes] = await Promise.all([
      this.tables.files.select('id', { count: 'exact', head: true }).eq('cover_image', coverImage),
      this.tables.links.select('id', { count: 'exact', head: true }).eq('cover_image', coverImage),
      this.tables.collections.select('id', { count: 'exact', head: true }).eq('cover_image', coverImage),
    ]);

    // If any count query failed or any references remain, preserve the storage object
    if (filesRes.error || linksRes.error || collectionsRes.error) return;
    const totalRefs = (filesRes.count ?? 0) + (linksRes.count ?? 0) + (collectionsRes.count ?? 0);
    if (totalRefs > 0) return;

    try {
      await this.supabaseService.storage.deleteFile(bucket, rest.join('/'));
    } catch (err) {
      console.warn(`[ResourcesDashboardService] Could not delete storage cover ${coverImage}:`, err);
    }
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
