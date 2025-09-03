import { Clipboard } from '@angular/cdk/clipboard';
import { Injectable } from '@angular/core';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { ConfigurationService } from '@picsa/configuration/src';
import { ENVIRONMENT } from '@picsa/environments/src';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { AnalyticsService } from '@picsa/shared/services/core/analytics.service';
import { PicsaDatabase_V2_Service, PicsaDatabaseAttachmentService } from '@picsa/shared/services/core/db_v2';
import { FileService } from '@picsa/shared/services/core/file.service';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { NativeStorageService } from '@picsa/shared/services/native';
import { _wait, arrayToHashmap } from '@picsa/utils';
import { RxCollection, RxDocument } from 'rxdb';
import { BehaviorSubject, lastValueFrom } from 'rxjs';

import { DB_COLLECTION_ENTRIES, DB_FILE_ENTRIES, DB_LINK_ENTRIES } from '../data';
import * as schemas from '../schemas';

export type IDownloadStatus = 'loading' | 'ready' | 'pending' | 'finalizing' | 'complete' | 'error';

@Injectable({ providedIn: 'root' })
export class ResourcesToolService extends PicsaAsyncService {
  /** Track active downloadStatus by resource ID */
  public downloads: Record<string, { progress: number; status: string }> = {};

  constructor(
    private dbService: PicsaDatabase_V2_Service,
    private dbAttachmentService: PicsaDatabaseAttachmentService,
    private configurationService: ConfigurationService,
    private nativeStorageService: NativeStorageService,
    private fileService: FileService,
    private analyticsService: AnalyticsService,
    private clipboard: Clipboard,
    private notificationService: PicsaNotificationService,
  ) {
    super();
  }

  private canShare: boolean;

  /**
   * Initialisation method automatically called on instantiation
   * Await completed state via the service `ready()` property
   */
  public override async init() {
    await this.dbService.ready();
    await this.dbAttachmentService.ready();
    if (Capacitor.isNativePlatform()) {
      await this.nativeStorageService.ready();
    }
    await this.dbInit();
    await this.populateHardcodedResources();
    const { value: canShareValue } = await Share.canShare();
    this.canShare = canShareValue;
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
    const { country_code } = this.configurationService.deploymentSettings();
    // global deployment code not filtered
    if (country_code === 'global') return docs;
    return docs.filter((doc) => {
      const filterCountries = doc.filter?.countries;
      if (!filterCountries) return true;
      return filterCountries.includes(country_code);
    });
  }

  public async openFileResource(uri: string, mimetype: string, id: string) {
    // track the resource open event
    this.analyticsService.trackResourceOpen(id);
    if (Capacitor.isNativePlatform()) {
      try {
        this.nativeStorageService.openFileURI(uri, mimetype);
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

  /**
   * Retrieve a doc attachment and convert to URI for use within components
   * NOTE - on web this will create an objectURL in the document which should be revoked when no longer required
   * @param convertFileSrc - Convert into usable src for rendering in webview. Typically required for files
   * rendered in webview (images, pdf), but not for files passed to native handlers (video, native file open)
   **/
  public async getFileAttachmentURI(doc: RxDocument<schemas.IResourceFile>, convertFileSrc: boolean) {
    const filename = doc.filename || doc.id;
    // when retrieving videos get result as a file:/// url, instead of http:// local url

    return this.dbAttachmentService.getFileAttachmentURI(doc, filename, convertFileSrc);
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

  public triggerResourceDownload(doc: RxDocument<schemas.IResourceFile>) {
    let downloadData: Blob;
    // Create observables that can be subscribed to from component that triggers method
    const progress$ = new BehaviorSubject(0);
    const status$ = new BehaviorSubject<IDownloadStatus>('pending');
    // Handle download, also passing back subscription so that component can cancel if required
    const download$ = this.fileService.downloadFile(doc.url, 'blob').subscribe({
      next: ({ progress, data }) => {
        progress$.next(progress);
        // NOTE - might be called multiple times before completing so avoid persisting data here
        if (progress === 100) {
          downloadData = data as Blob;
          status$.next('finalizing');
        }
      },
      error: (error) => {
        status$.next('error');
        console.error(error);
        throw error;
      },
      complete: async () => {
        // give small timeout to allow UI to update
        await _wait(100);
        // persist to document attachment
        await this.putFileAttachment(doc, downloadData);
        status$.next('complete');
        status$.complete();
        progress$.complete();
      },
    });
    return { progress$, status$, download$ };
  }

  private async populateHardcodedResources() {
    // Remove resources marked for deletion (TODO - find cleaner method to keep in sync)
    // TODO - process after cache check
    await this.deleteRemovedResources();

    // Use caching system to only populate once per app version launch in production
    const assetsCacheVersion = this.getAssetResourcesVersion();
    if (ENVIRONMENT.production && assetsCacheVersion === ENVIRONMENT.version) {
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

  /** Remove any resources that no longer appear in hardcoded resource list */
  private async deleteRemovedResources() {
    // TODO - likely more efficient to track locally docs with a _deleted property (?)
    // But keep as-is for now to ensure any legacy data cleaned
    const collectionDeletes = await this.diffDBHardcodedResources(this.dbCollections as any, DB_COLLECTION_ENTRIES);
    const fileDeletes = await this.diffDBHardcodedResources(this.dbFiles as any, DB_FILE_ENTRIES);
    const LinkDeletes = await this.diffDBHardcodedResources(this.dbLinks as any, DB_LINK_ENTRIES);

    await this.dbCollections.bulkRemove(collectionDeletes);
    // TODO - ensure attachments removed also
    await this.dbFiles.bulkRemove(fileDeletes);
    await this.dbLinks.bulkRemove(LinkDeletes);
  }
  /**
   * Compare list of hardcoded resources with db collection, returning IDs of any resources that
   * exist in DB but not in hardcoded
   * */
  private async diffDBHardcodedResources(
    collection: RxCollection<schemas.IResourceBase>,
    hardcoded: schemas.IResourceBase[],
  ) {
    const hardcodedHashmap = arrayToHashmap(hardcoded, 'id');
    const dbEntries = await collection.find().exec();
    return dbEntries.filter((doc) => !(doc.id in hardcodedHashmap)).map((doc) => doc.id);
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
          const blob = res.data as Blob;
          const existingAttachment = dbDoc.getAttachment(dbDoc.filename);
          // ignore update if attachment same size as existing, otherwise remove existing attachment before putting new
          // TODO - add tests to confirm behaviour is as expected (or manually test with modified files)
          if (existingAttachment) {
            if (blob.size === existingAttachment?.length) return;
            await this.removeFileAttachment(dbDoc);
          }
          await this.putFileAttachment(dbDoc, blob);
        }
      }
    }
  }

  private getAssetResourcesVersion() {
    return localStorage.getItem(`picsa-resources-tool||assets-cache-version`);
  }

  private setAssetResourcesVersion() {
    return localStorage.setItem(`picsa-resources-tool||assets-cache-version`, ENVIRONMENT.version);
  }

  public async shareLink(url: string) {
    if (this.canShare) {
      await Share.share({
        title: 'Share Resource',
        url: url,
        dialogTitle: 'Share Resource Link',
      });
    } else {
      // Simply copy the link to clipboard
      this.clipboard.copy(url);
      this.notificationService.showUserNotification({
        matIcon: 'success',
        message: 'Link to this resource has been copied for you to share.',
      });
    }
  }
  public async shareFileNative(uri: string) {
    // HACK - files can only be shared from the cache folder (unless specific permissions granted)
    // Copy to cache folder, share and delete from cache
    // https://capacitorjs.com/docs/v5/apis/share#android
    // https://capawesome.io/plugins/file-opener/#android
    const cacheFileUri = await this.nativeStorageService.copyFileToCache(uri);
    const filename = uri.split('/').pop() as string;
    if (cacheFileUri) {
      await Share.share({
        files: [cacheFileUri],
        title: filename,
        dialogTitle: 'Share File',
        text: 'Shared from Picsa App',
      });
      // NOTE - sharing callback will return after delegating task (e.g. open whatsapp to share),
      // so do not delete cache file as no guarantee target task completed

      // await Filesystem.deleteFile({ path: cacheFileUri, directory: Directory.Cache });
    }
  }
}
