import { Injectable } from '@angular/core';
import { ConfigurationService } from '@picsa/configuration/src';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { PicsaDatabase_V2_Service, PicsaDatabaseAttachmentService } from '@picsa/shared/services/core/db_v2';
import { RxCollection, RxDocument } from 'rxdb';

import { DB_COLLECTION_ENTRIES, DB_FILE_ENTRIES, DB_LINK_ENTRIES } from '../data';
import * as schemas from '../schemas';

@Injectable({ providedIn: 'root' })
export class ResourcesToolService extends PicsaAsyncService {
  constructor(
    private dbService: PicsaDatabase_V2_Service,
    private dbAttachmentService: PicsaDatabaseAttachmentService,
    private configurationService: ConfigurationService
  ) {
    super();
  }

  /**
   * Initialisation method automatically called on instantiation
   * Await completed state via the service `ready()` property
   */
  public override async init() {
    await this.dbService.ready();
    await this.dbAttachmentService.ready();
    await this.dbInit();
    await this.populateAssetResources();
  }

  private async dbInit() {
    await this.dbService.ensureCollections({
      resources_tool_collections: schemas.COLLECTION_COLLECTION,
      resources_tool_files: schemas.FILES_COLLECTION,
      resources_tool_links: schemas.LINKS_COLLECTION,
    });
    await this.dbCollections.bulkUpsert(DB_COLLECTION_ENTRIES);
    await this.dbFiles.bulkUpsert(DB_FILE_ENTRIES);
    await this.dbLinks.bulkUpsert(DB_LINK_ENTRIES);
  }

  /** Provide database options tool collection (with typings) */
  public get dbCollections() {
    return this.dbService.db.collections['resources_tool_collections'] as RxCollection<schemas.IResourceCollection>;
  }
  public get dbFiles() {
    return this.dbService.db.collections['resources_tool_files'] as RxCollection<schemas.IResourceFile>;
  }
  public get dbLinks() {
    return this.dbService.db.collections['resources_tool_links'] as RxCollection<schemas.IResourceLink>;
  }

  public filterLocalisedResources<T extends schemas.IResourceBase>(docs: T[]) {
    const { code } = this.configurationService.activeConfiguration.localisation.country;
    // global deployment code "" not filtered
    if (!code) return docs;
    return docs.filter((doc) => {
      const filterCountries = doc.filter?.countries;
      if (!filterCountries) return true;
      return filterCountries.includes(code);
    });
  }

  public async putFileAttachment(doc: RxDocument<schemas.IResourceFile>, data: Blob) {
    return this.dbAttachmentService.putAttachment(doc, doc.filename, data);
  }

  public getFileAttachment(doc: RxDocument<schemas.IResourceFile>) {
    return this.dbAttachmentService.getAttachment(doc, doc.filename);
  }
  /**
   * Retrieve a doc attachment and convert to URI for use within components
   * NOTE - on web this will create an objectURL in the document which should be revoked when no longer required
   **/
  public async getFileAttachmentURI(doc: RxDocument<schemas.IResourceFile>) {
    return this.dbAttachmentService.getFileAttachmentURI(doc);
  }
  /**
   * Release a file attachment URI when no longer required
   * @param filenames specific resource filenames to revoke (default all)
   * */
  public async revokeFileAttachmentURIs(filenames: string[]) {
    return this.dbAttachmentService.revokeFileAttachmentURIs(filenames);
  }

  public removeFileAttachment(doc: RxDocument<schemas.IResourceFile>) {
    return this.dbAttachmentService.removeAttachment(doc, doc.filename);
  }

  private async populateAssetResources() {
    // TODO - use assets manifest to populate attachments
  }
}
