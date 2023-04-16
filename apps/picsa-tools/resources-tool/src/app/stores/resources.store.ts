import { Injectable } from '@angular/core';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { ConfigurationService } from '@picsa/configuration';
import {
  IStorageFilesHashmap,
  NativeStorageService,
} from '@picsa/shared/services/native/storage-service';
import { action } from 'mobx-angular';
import { lastValueFrom } from 'rxjs';

import RESOURCES from '../data';
import {
  IResource,
  IResourceCollection,
  IResourceFile,
  IResourceItemBase,
} from '../models';

/****************************************************************************************
 *  The resources store offers methods to list, download and open resources.
 ****************************************************************************************/
@Injectable({
  providedIn: 'root',
})
export class ResourcesStore {
  isNative = Capacitor.isNativePlatform();
  /** Country code from app configuration used to filter resources */
  private appConfigCountryCode: string;
  constructor(
    private storageService: NativeStorageService,
    private configurationService: ConfigurationService
  ) {
    this.init();
  }
  resourcesById: { [id: string]: IResource } = {};
  /** Parent collections */
  collections: IResourceCollection[];

  public downloadedResources: IStorageFilesHashmap = {};

  @action
  /**
   *  Load resources listed in cache.
   *  @param checkUpdates - check if hardcoded data lists any additional resources
   *  that should be popluated, and check server for any updates also
   */
  private async init() {
    this.listenToConfigurationChanges();
    if (this.isNative) {
      await this.storageService.init();
      await this.checkHardcodedData();
      // subscribe to cached files updates
      this.storageService.cachedFilesUpdated$.subscribe(() => {
        const downloaded = this.storageService.getCacheFilesByPath('resources');
        this.downloadedResources = downloaded;
      });
    }
    console.log('[Resources] init complete');
  }
  private listenToConfigurationChanges() {
    this.configurationService.activeConfiguration$.subscribe((config) => {
      const { code } = config.localisation.country;
      if (code !== this.appConfigCountryCode) {
        this.appConfigCountryCode = code;
        this.populateCountryResources(this.appConfigCountryCode);
      }
    });
  }

  private sortResources<T extends IResourceItemBase>(resources: T[]) {
    return resources.sort(
      (a: IResourceItemBase, b: IResourceItemBase) =>
        (b.priority ?? -99) - (a.priority ?? -99)
    );
  }

  /**
   * Populate resources for current country code
   * TODO - would be cleaner if implementing more like a tree/graph
   * https://github.com/joaonuno/tree-model-js OR https://github.com/dagrejs/graphlib
   */
  private populateCountryResources(countryCode: string) {
    // take a copy of all resources to preserve original
    const resourcesById: { [id: string]: IResource } = JSON.parse(
      JSON.stringify(RESOURCES.byId)
    );
    // Remove any collections with country filters (include all resources if no countryCode provided)
    Object.entries(resourcesById).forEach(([key, resource]) => {
      if (
        countryCode &&
        resource.appCountries &&
        !resource.appCountries.includes(countryCode)
      ) {
        delete resourcesById[key];
        if (resource.type === 'collection') {
          const collection = resource as IResourceCollection;
          // remove collection children
          collection.childResources.forEach((childKey) => {
            delete resourcesById[childKey];
          });
        }
      }
    });
    this.resourcesById = resourcesById;
    this.populateCountryCollections(resourcesById);
  }
  /**
   * Once resources have been filtered by country reassign collections to only include
   * child resources that still exist.
   */
  private populateCountryCollections(resourcesById: {
    [id: string]: IResource;
  }) {
    // Reassign collection children
    const allCollections = Object.values(resourcesById)
      .filter((r) => r.type === 'collection')
      .map((r) => {
        const collection = r as IResourceCollection;
        collection.childResources = collection.childResources.filter(
          (childKey) => resourcesById.hasOwnProperty(childKey)
        );
        // also update main list
        resourcesById[collection._key] = collection;
        return collection;
      })
      // remove empty collections
      .filter((r) => r.childResources.length > 0);
    const mainCollections = allCollections.filter((c) => !c.parentResource);
    this.collections = this.sortResources(mainCollections);
  }

  public getResourceById<T extends IResource>(id: string) {
    return this.resourcesById[id] as T;
  }
  public isFileDownloaded(file: IResourceFile) {
    if (this.isNative) {
      return !!this.downloadedResources[`resources/${file.filename}`];
    } else {
      return true;
    }
  }

  async openFileResource(resource: IResourceFile) {
    if (this.isNative) {
      try {
        this.storageService.openFile(
          `resources/${resource.filename}`,
          resource.mimetype
        );
      } catch (error) {
        console.error(error);
      }
    } else {
      return Browser.open({ url: resource.url });
    }
  }

  async openBrowserLink(url: string) {
    return Browser.open({ url: url });
  }

  // create an observable that stream progress snapshots and completes when file downloaded
  public downloadResource(resource: IResourceFile) {
    console.log('[Resource] download', resource);
    return this.storageService.downloadToCache({
      downloadUrl: resource.url,
      // TODO - add support for downloading to nested folder
      relativePath: `resources/${resource.filename}`,
    });
  }

  // TODO - code similar to budget store, should find way to combine
  // also should check budget hardcoded if will be overwritten
  // because no keepModified
  private async checkHardcodedData() {
    const contents = await this.storageService.readAssetContents('resources');
    console.log('[Resources] contents', contents);
    const unCachedFiles = Object.values(contents).filter(
      (entry) => !this.storageService.checkFileCached(entry)
    );
    console.log('[Resources] caching', unCachedFiles);
    const promises = unCachedFiles.map(async ({ relativePath }) => {
      const dl$ = this.storageService.downloadToCache({
        relativePath,
        downloadUrl: `assets/${relativePath}`,
      });
      return lastValueFrom(dl$);
    });
    const res = await Promise.all(promises);
    console.log('[Resources] cached', res);
  }
}
