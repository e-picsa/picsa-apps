import { Injectable } from '@angular/core';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { ConfigurationService } from '@picsa/configuration/src';
import { APP_VERSION } from '@picsa/environments/src';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { PicsaDatabase_V2_Service, PicsaDatabaseAttachmentService } from '@picsa/shared/services/core/db_v2';
import { FileService } from '@picsa/shared/services/core/file.service';
import { NativeStorageService } from '@picsa/shared/services/native';
import { _wait, arrayToHashmap } from '@picsa/utils';
import { RxCollection, RxDocument } from 'rxdb';
import { lastValueFrom } from 'rxjs';

import { DB_COLLECTION_ENTRIES, DB_FILE_ENTRIES, DB_LINK_ENTRIES } from '../data';
import * as schemas from '../schemas';

@Injectable({ providedIn: 'root' })
export class ResourcesToolService extends PicsaAsyncService {
  constructor(
    private dbService: PicsaDatabase_V2_Service,
    private dbAttachmentService: PicsaDatabaseAttachmentService,
    private configurationService: ConfigurationService,
    private storageService: NativeStorageService,
    private fileService: FileService
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
    await this.populateHardcodedResources();
  }

  private async dbInit() {
    await this.dbService.ensureCollections({
      resources_tool_collections: schemas.COLLECTION_COLLECTION,
      resources_tool_files: schemas.FILES_COLLECTION,
      resources_tool_links: schemas.LINKS_COLLECTION,
    });
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

  public async openFileResource(uri: string, mimetype: string) {
    if (Capacitor.isNativePlatform()) {
      try {
        this.storageService.openFile(uri, mimetype);
      } catch (error) {
        console.error(error);
      }
    } else {
      return Browser.open({ url: uri });
    }
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

  private async populateHardcodedResources() {
    // Use caching system to only populate once per app version launch
    const assetsCacheVersion = this.getAssetResourcesVersion();
    if (assetsCacheVersion === APP_VERSION.number) {
      return;
    }
    // Update DB with hardcoded entries
    await this.dbCollections.bulkUpsert(DB_COLLECTION_ENTRIES);
    await this.dbFiles.bulkUpsert(DB_FILE_ENTRIES);
    await this.dbLinks.bulkUpsert(DB_LINK_ENTRIES);

    // Populate assets included in app build
    await this.copyResourcesFromAssets();
    this.setAssetResourcesVersion();
  }

  /** Copy hardcoded assets to db (if checksums match) */
  private async copyResourcesFromAssets() {
    // Populate files from cache
    const fileEntries = await this.dbFiles.find().exec();
    const dbChecksumHashmap = arrayToHashmap(fileEntries, '_data', (el) => el._data.md5Checksum);
    const contents = await this.fileService.readAssetContents('resources');
    for (const { md5Checksum, relativePath } of Object.values(contents)) {
      const dbDoc = dbChecksumHashmap[md5Checksum];
      // TODO - could skip if db already contains attachment (although would need systme to track update)
      // and can't easiliy use asset digest. Would likely need to track db updates instead of bulk
      if (dbDoc) {
        const res = await lastValueFrom(this.fileService.downloadFile(`/assets/${relativePath}`, 'blob'));
        if (res?.data) {
          await this.putFileAttachment(dbDoc, res.data as Blob);
        }
      }
    }
  }

  private getAssetResourcesVersion() {
    return localStorage.getItem(`picsa-resources-tool||assets-cache-version`);
  }

  private setAssetResourcesVersion() {
    return localStorage.setItem(`picsa-resources-tool||assets-cache-version`, APP_VERSION.number);
  }
}
