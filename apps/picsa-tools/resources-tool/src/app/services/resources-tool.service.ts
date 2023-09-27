import { Injectable } from '@angular/core';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { PicsaDatabase_V2_Service } from '@picsa/shared/services/core/db_v2';
import { RxCollection, RxDocument } from 'rxdb';

import { DB_FILE_ENTRIES } from '../data';
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

  public getFileAttachment(doc: RxDocument<schemas.IResourceFile>) {
    return this.dbService.getAttachment('resources_tool_files', doc as any);
  }

  private async populateFileList() {
    await this.dbFileCollection.bulkUpsert(DB_FILE_ENTRIES);
  }

  private async populateAssetResources() {
    // TODO - use assets manifest to populate attachments
  }
}
