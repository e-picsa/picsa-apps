import { Injectable } from '@angular/core';
import { observable, action, computed } from 'mobx-angular';
import {
  IStorageFilesHashmap,
  NativeStorageService,
} from '@picsa/shared/services/native/storage-service';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import RESOURCES from '../data';
import { IResource, IResourceFile, IResourceLink } from '../models';

/****************************************************************************************
 *  The resources store offers methods to list, download and open resources.
 ****************************************************************************************/
@Injectable({
  providedIn: 'root',
})
export class ResourcesStore {
  @observable resources: IResource[] = [];
  isNative = Capacitor.isNativePlatform();
  constructor(private storageService: NativeStorageService) {
    this.init();
  }
  resourcesById = RESOURCES.byId;
  @observable collections = RESOURCES.collection.filter(
    (c) => !c.parentResource
  );

  @computed get sortedResources() {
    return [...this.resources].sort((a, b) => {
      return a._created > b._created ? 1 : -1;
    });
  }

  public downloadedResources: IStorageFilesHashmap = {};

  @action
  /**
   *  Load resources listed in cache.
   *  @param checkUpdates - check if hardcoded data lists any additional resources
   *  that should be popluated, and check server for any updates also
   */
  private async init() {
    if (this.isNative) {
      await this.storageService.init();
      await this.checkHardcodedData();
      this.downloadedResources = this.checkDownloadedResources();
      console.log('[Resources] downloaded', this.downloadedResources);
    }
    console.log('[Resources] init complete');
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
