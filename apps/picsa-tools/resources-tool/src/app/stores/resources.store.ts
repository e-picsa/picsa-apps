import { Injectable } from '@angular/core';
import { observable, action, computed } from 'mobx-angular';
import { PicsaDbService } from '@picsa/shared/services/core/db';
import { PicsaFileService } from '@picsa/shared/services/native/file-service';
import { Platform } from '@ionic/angular';
import { Observable } from 'rxjs';
import { toJS } from 'mobx';
import RESOURCES from '../data/resources';
import { IResource, IResourceCollection, IResourceFile } from '../models';

/****************************************************************************************
 *  The resources store offers methods to list, download and open resources.
 ****************************************************************************************/
@Injectable({
  providedIn: 'root',
})
export class ResourcesStore {
  @observable resources: IResource[] = [];
  @observable downloads: any[] = [];
  constructor(
    private db: PicsaDbService,
    private fileService: PicsaFileService,
    private platform: Platform
  ) {
    this.resourceInit();
    if (this.platform.is('cordova')) {
      this.checkDownloadedResources();
    }
  }
  @observable collections = RESOURCES.collections;
  @observable resourceStandalone = RESOURCES.standalone;

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
  public getCollectionById(id: string, subcollectionId?: string) {
    const collection = this.collections.find((c) => c._key === id);
    if (subcollectionId) {
      return (collection as IResourceCollection).resources.find(
        (c) => c._key === subcollectionId
      );
    }
    return collection;
  }

  /**
   * Initialise file server, list storage directory and save list of downloaded resources
   */
  async checkDownloadedResources() {
    // ensure file service initialised and directories present
    await this.fileService.ready();
    this.downloads = await this.fileService.ensureDirectory(
      'storage',
      'resources'
    );
    console.log('downloads', toJS(this.downloads));
    // this.fileService.copyAppApk();
  }

  async openResource(resource: IResourceFile) {
    console.log('open resource', resource);
    if (this.platform.is('cordova')) {
      try {
        this.fileService.openFileCordova(
          'storage',
          `resources/${resource.filename}`
        );
      } catch (error) {
        console.error(error);
        await this.updateCachedResource(resource, { _isDownloaded: false });
        return this.resourceInit(false);
      }
    } else {
      return window.open(resource.weblink, '_blank');
    }
  }

  async copyHardcodedResource(resource: IResourceFile) {
    console.log('copying resource', resource);
    await this.fileService.copyAssetFile('resources', resource.filename);
    await this.updateCachedResource(resource, { _isDownloaded: true });
  }

  // create an observable that stream progress snapshots and completes when file downloaded
  downloadResource(resource: IResourceFile) {
    console.log('downloading resource', resource.weblink);
    // only download on cordova
    return new Observable<number>((observer) => {
      if (this.platform.is('cordova')) {
        // double check not already downloaded
        if (!this.downloads.includes(resource.filename)) {
          this.fileService
            .downloadToStorage(resource.weblink, 'resources', resource.filename)
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
                  _isDownloaded: true,
                }).then(() => observer.complete())
            );
        }
      } else {
        this.updateCachedResource(resource, { _isDownloaded: true }).then(() =>
          observer.complete()
        );
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
    const newerResources = RESOURCES.combined.filter((r) => {
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
        const { _isHardcoded, filename } = resource as IResourceFile;
        if (_isHardcoded && this.platform.is('cordova')) {
          console.log('copying resource', filename);
          await this.copyHardcodedResource(resource as IResourceFile);
        }
      }
      await this.db.setDocs('resources', newerResources, false, true);
      this.resourceInit(false);
    }
  }
}
