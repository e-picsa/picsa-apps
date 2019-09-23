import { Injectable } from '@angular/core';
import { observable, action, computed } from 'mobx-angular';
import { IResource } from '../models/models';
import { PicsaDbService } from '@picsa/services/core/db';
import { PicsaFileService } from '@picsa/services/native/file-service';
import { RESOURCES } from '../data';
import { Platform } from '@ionic/angular';
import { Observable } from 'rxjs';
import { toJS } from 'mobx';

/****************************************************************************************
 *  The resources store offers methods to list, download and open resources.
 ****************************************************************************************/
@Injectable({
  providedIn: 'root'
})
export class ResourcesStore {
  @observable resources: IResource[] = [];
  @observable downloads = [];
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
  /**
   * Initialise file server, list storage directory and save list of downloaded resources
   */
  async checkDownloadedResources() {
    // ensure file service initialised and directories present
    await this.fileService.init();
    this.downloads = await this.fileService.ensureDirectory(
      'storage',
      'resources'
    );
  }

  async openResource(resource: IResource) {
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

  async copyHardcodedResource(resource: IResource) {
    console.log('copying resource', resource);
    await this.fileService.copyAssetFile('resources', resource.filename);
    await this.updateCachedResource(resource, { _isDownloaded: true });
  }

  // create an observable that stream progress snapshots and completes when file downloaded
  downloadResource(resource: IResource) {
    console.log('downloading resource', resource.weblink);
    // only download on cordova
    return new Observable<number>(observer => {
      if (this.platform.is('cordova')) {
        // double check not already downloaded
        if (!this.downloads.includes(resource.filename)) {
          this.fileService
            .downloadFile(resource.weblink, resource.filename)
            .subscribe(
              progress =>
                observer.next(
                  Math.round((progress.loaded / progress.total) * 100)
                ),
              err => {
                throw err;
              },
              () =>
                this.updateCachedResource(resource, {
                  _isDownloaded: true
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
  private async updateCachedResource(
    resource: IResource,
    update: Partial<IResource>
  ) {
    const doc = { ...toJS(resource), ...update };
    await this.db.setDoc('resources', doc, false, true);
    this.resourceInit(false);
  }

  private async _checkForUpdates(cached: IResource[]) {
    const latest = cached
      .map(r => r._modified)
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
    cached.forEach(r => (cacheList[r._key] = r._modified));
    const newerResources = RESOURCES.filter(r => {
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
      for (let resource of newerResources) {
        if (resource._isHardcoded) {
          console.log('copying resource', resource.filename);
          await this, this.copyHardcodedResource(resource);
        }
      }
      await this.db.setDocs('resources', newerResources, false, true);
      this.resourceInit(false);
    }
  }
}
