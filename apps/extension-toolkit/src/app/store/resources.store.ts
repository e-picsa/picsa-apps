import { Injectable } from '@angular/core';
import { observable, action, computed } from 'mobx-angular';
import { IResource, IResourceDB } from '../models/models';
import { PicsaDbService } from '@picsa/services/core';
import { PicsaFileService } from '@picsa/services/native/file-service';
import { IDBEndpoint } from '@picsa/models/db.models';
import { APP_VERSION } from '@picsa/environments/version';
import { RESOURCES } from '../data';

@Injectable({
  providedIn: 'root'
})
export class ResourcesStore {
  @observable resources: IResource[] = [];

  constructor(
    private db: PicsaDbService,
    private fileService: PicsaFileService
  ) {
    this.resourceInit();
  }

  @action
  async resourceInit() {
    const cached = await this.db.getCollection<IResource>('resources', 'cache');
    if (cached.length === 0) {
      await this.setHardcodedData();
      return this.resourceInit();
    }
    console.log('cached resources', cached);
    this.resources = cached;
  }

  // TODO - code similar to budget store, should find way to combine
  private async setHardcodedData() {
    const endpoint: IDBEndpoint = 'resources';

    const resources: IResource[] = RESOURCES;
    const dbDocs: IResourceDB[] = resources.map(r => {
      return {
        ...r,
        _created: new Date(APP_VERSION.date).toISOString(),
        _modified: new Date(APP_VERSION.date).toISOString()
      };
    });
    console.log('setting docs', dbDocs);
    await this.db.setDocs(endpoint, dbDocs);
  }
}
