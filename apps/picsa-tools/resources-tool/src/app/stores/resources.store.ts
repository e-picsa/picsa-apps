import { Injectable } from '@angular/core';
import { observable, action, computed } from 'mobx-angular';
import {
  IStorageFilesHashmap,
  NativeStorageService,
} from '@picsa/shared/services/native/storage-service';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import RESOURCES from '../data';
import {
  IResource,
  IResourceFile,
  IResourceCollection,
  IResourceItemBase,
} from '../models';
import { ConfigurationService } from '@picsa/configuration';

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
      this.downloadedResources = this.checkDownloadedResources();
      console.log('[Resources] downloaded', this.downloadedResources);
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
   */
  private populateCountryResources(countryCode: string) {
    // take a copy of all resources to preserve original
    const resourcesById: { [id: string]: IResource } = JSON.parse(
      JSON.stringify(RESOURCES.byId)
    );
    // Remove any collections with country filters
    Object.entries(resourcesById).forEach(([key, resource]) => {
      if (
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
  public async downloadResource(resource: IResourceFile) {
    // console.log('downloading resource', resource.url);
    // // only download on cordova
    // return new Observable<number>((observer) => {
    //   if (this.platform.is('cordova')) {
    //     // double check not already downloaded
    //     if (!this.downloadResource[resource.filename]) {
    //       this.fileService
    //         .downloadToStorage(resource.url, 'resources', resource.filename)
    //         .subscribe(
    //           (progress) => {
    //             const p = Math.round((progress.loaded / progress.total) * 100);
    //             observer.next(p);
    //           },
    //           (err) => {
    //             throw err;
    //           },
    //           () =>
    //             this.updateCachedResource(resource, {
    //               // _isDownloaded: true,
    //             }).then(() => observer.complete())
    //         );
    //     }
    //   } else {
    //     this.updateCachedResource(resource, {
    //       //  _isDownloaded: true
    //     }).then(() => observer.complete());
    //   }
    // });
  }

  private async checkServerUpdates(cached: IResource[]) {
    // const latest = cached
    //   .map((r) => r._modified)
    //   .sort()
    //   .reverse()[0];
    // const updates = await this.db.getCollection('resources', 'server', latest);
    // if (updates.length > 0) {
    //   await this.db.setDocs('resources', updates);
    //   await this.resourceInit(false);
    // }
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
    await this.storageService.downloadToCache(
      unCachedFiles.map(({ relativePath }) => ({
        relativePath,
        downloadUrl: `assets/${relativePath}`,
      }))
    );
  }

  private checkDownloadedResources() {
    const cachedFiles = this.storageService.getCacheFilesByPath('resources');
    return cachedFiles;
  }
}
