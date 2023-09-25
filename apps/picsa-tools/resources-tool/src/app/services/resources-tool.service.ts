import { Injectable } from '@angular/core';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { PicsaDatabase_V2_Service } from '@picsa/shared/services/core/db_v2';
import { RxCollection } from 'rxdb';

import HARDCODED_RESOURCES from '../data';
import * as schemas from '../schemas';

@Injectable({ providedIn: 'root' })
export class ResourcesToolService extends PicsaAsyncService {
  constructor(private dbService: PicsaDatabase_V2_Service) {
    super();
  }

  /**
   * Initialisation method automatically called on instantiation
   * Await completed state via the service `ready()` property
   */
  public override async init() {
    await this.dbService.ensureCollections({
      resources_tool_files: schemas.FILES_COLLECTION,
    });
    await this.populateFileList();
    await this.populateAssetResources();
  }

  /** Provide database options tool collection (with typings) */
  public get dbFileCollection() {
    return this.dbService.db.collections['resources_tool_files'] as RxCollection<schemas.IResourceFile>;
  }

  private async populateFileList() {
    // TODO - ideally refactor hardcoded to keep all file resources together and remove store methods
    const { file, video } = HARDCODED_RESOURCES;
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const combined = [...file, ...video];
    const fileResources: schemas.IResourceFile[] = combined.map((entry) => {
      const { _created, _key, _modified, _downloaded, meta, appCountries, image, imageFit, subtitle, ...keptFields } =
        entry;
      const file: schemas.IResourceFile = {
        ...keptFields,
        id: _key,
        md5Hash: 'TODO',
        size_kb: -1,
        priority: entry.priority || 1,
      };
      return file;
    });
    console.log('populating file resources', fileResources);
    // TODO - handle resource removal or file updated
    await this.dbFileCollection.bulkUpsert(fileResources);
    // dbFormCollection.bulkUpsert(HARDCODED_FORMS);
  }

  private async populateAssetResources() {
    // TODO - use assets manifest to populate attachments
  }
}
