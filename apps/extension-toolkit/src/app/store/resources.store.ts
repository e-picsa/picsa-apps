import { Injectable } from '@angular/core';
import { observable, action, computed } from 'mobx-angular';
import { IResource } from '../models/models';
import { PicsaDbService } from '@picsa/services/core';
import { PicsaFileService } from '@picsa/services/native/file-service';
import { RESOURCES } from '../data';
import { ENVIRONMENT } from '@picsa/environments';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ResourcesStore {
  @observable resources: IResource[] = [];
  @observable downloads = {};
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
  async resourceInit(checkUpdates = true) {
    const cached = await this.db.getCollection<IResource>('resources', 'cache');
    this.resources = cached;
    if (checkUpdates) {
      await this.checkHardcodedData(cached);
      await this._checkForUpdates(cached);
    }
  }
  @action
  async checkDownloadedResources() {
    console.log('checking downloaded resources');
    const downloads = await this.fileService.listDirectory('storage', 'picsa');
    console.log('downloads', downloads);
  }

  openResource(resource: IResource) {
    return this.platform.is('cordova')
      ? this.fileService.openFileCordova(resource.filename)
      : window.open(resource.weblink, '_blank');
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
      return !cached || lastCache < r._modified;
    });
    if (newerResources.length > 0) {
      console.log('adding hardcoded resources', newerResources);
      // when setting hardcoded resources to db make sure not to overwrite
      // _modified timestamp as could miss updates (although unlikely as
      // resources rarely modified)
      await this.db.setDocs('resources', newerResources, false, true);
    }
  }
}
