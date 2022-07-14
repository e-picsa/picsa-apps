import { Injectable } from '@angular/core';
import { observable, action, computed } from 'mobx-angular';
import { PicsaDbService } from '@picsa/shared/services/core/db';
import { PicsaFileService } from '@picsa/shared/services/native/file-service';
import { Platform } from '@ionic/angular';
import type { Entry as FileEntry } from '@ionic-native/file/ngx';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Observable } from 'rxjs';
import { toJS } from 'mobx';
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
  downloadedResources: { [filename: string]: FileEntry } = {};
  isNative = Capacitor.isNativePlatform();
  constructor(
    private db: PicsaDbService,
    private fileService: PicsaFileService,
    private platform: Platform
  ) {
    this.resourceInit();
    if (this.isNative) {
      this.checkDownloadedResources();
    }
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

  @action
  /**
   *  Load resources listed in cache.
   *  @param checkUpdates - check if hardcoded data lists any additional resources
   *  that should be popluated, and check server for any updates also
   */
  async resourceInit(checkUpdates = true) {
    const cached = await this.db.getCollection<IResource>('resources', 'cache');
    this.resources = cached;
    if (checkUpdates) {
      console.log('checking updates');
      await this.checkHardcodedData(cached);
      await this._checkForUpdates(cached);
    }
  }
  public getResourceById<T extends IResource>(id: string) {
    return this.resourcesById[id] as T;
  }
  public isFileDownloaded(file: IResourceFile) {
    if (this.isNative) {
      return !!this.downloadedResources[file.filename];
    } else {
      return true;
    }
  }

  /**
   * Initialise file server, list storage directory and save list of downloaded resources
   */
  private async checkDownloadedResources() {
    // ensure file service initialised and directories present
    await this.fileService.ready();
    const downloads = await this.fileService.ensureDirectory(
      'storage',
      'resources'
    );
    const downloadedResources: typeof this.downloadedResources = {};
    downloads.forEach((d) => (downloadedResources[d.name] = d));
    this.downloadedResources = downloadedResources;
  }

  async openFileResource(resource: IResourceFile) {
    if (this.isNative) {
      try {
        this.fileService.openFileCordova(
          'storage',
          `resources/${resource.filename}`
        );
      } catch (error) {
        console.error(error);
        await this.updateCachedResource(resource, {
          // _isDownloaded: false
        });
        return this.resourceInit(false);
      }
    } else {
      console.log('non-native open', Browser);
      return Browser.open({ url: resource.url });
      // return window.open(resource.url, '_blank');
    }
  }

  async openLinkresource(resource: IResourceLink) {
    return Browser.open({ url: resource.url });
  }

  async copyHardcodedResource(resource: IResourceFile) {
    console.log('copying resource', resource);
    await this.fileService.copyAssetFile('resources', resource.filename);
    await this.updateCachedResource(resource, {
      // _isDownloaded: true
    });
  }

  // create an observable that stream progress snapshots and completes when file downloaded
  public async downloadResource(resource: IResourceFile) {
    console.log('downloading resource', resource.url);
    // only download on cordova
    return new Observable<number>((observer) => {
      if (this.platform.is('cordova')) {
        // double check not already downloaded
        if (!this.downloadResource[resource.filename]) {
          this.fileService
            .downloadToStorage(resource.url, 'resources', resource.filename)
            .subscribe(
              (progress) => {
                const p = Math.round((progress.loaded / progress.total) * 100);
                observer.next(p);
              },
              (err) => {
                throw err;
              },
              () =>
                this.updateCachedResource(resource, {
                  // _isDownloaded: true,
                }).then(() => observer.complete())
            );
        }
      } else {
        this.updateCachedResource(resource, {
          //  _isDownloaded: true
        }).then(() => observer.complete());
      }
    });
  }

  // update cached resource entry (e.g. mark resource as downloaded)
  private async updateCachedResource<T extends IResource>(
    resource: T,
    update: Partial<T>
  ) {
    const doc = { ...toJS(resource), ...update };
    await this.db.setDoc('resources', doc, false, true);
    this.resourceInit(false);
  }

  private async _checkForUpdates(cached: IResource[]) {
    const latest = cached
      .map((r) => r._modified)
      .sort()
      .reverse()[0];
    const updates = await this.db.getCollection('resources', 'server', latest);
    if (updates.length > 0) {
      await this.db.setDocs('resources', updates);
      await this.resourceInit(false);
    }
  }

  // TODO - code similar to budget store, should find way to combine
  // also should check budget hardcoded if will be overwritten
  // because no keepModified
  private async checkHardcodedData(cached: IResource[]) {
    // check if cache resources are fresher than hardcoded
    const cacheList = {};
    cached.forEach((r) => (cacheList[r._key] = r._modified));
    const newerResources = Object.values(RESOURCES.byId).filter((r) => {
      const lastCache = cacheList[r._key];
      return !lastCache || lastCache < r._modified;
    });
    if (newerResources.length > 0) {
      // id hardcoded resources
      // when setting hardcoded resources to db make sure not to overwrite
      // _modified timestamp as could miss updates (although unlikely as
      // resources rarely modified)
      console.log('newer resources detected', newerResources);
      // if hardcoded copy from assets folder first (if not already done)
      // TODO - add check to see if already copied over (use this.downloads)
      for (const resource of newerResources) {
        // const { _isHardcoded, filename } = resource as IResourceFile;
        // if (_isHardcoded && this.platform.is('cordova')) {
        //   console.log('copying resource', filename);
        //   await this.copyHardcodedResource(resource as IResourceFile);
        // }
      }
      await this.db.setDocs('resources', newerResources, false, true);
      this.resourceInit(false);
    }
  }
}
