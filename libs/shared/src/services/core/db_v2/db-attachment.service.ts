import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { base64ToBlob } from '@picsa/utils';
import { blobToBase64String, RxCollection, RxDocument } from 'rxdb';

import { PicsaAsyncService } from '../../asyncService.service';
import { NativeStorageService } from '../../native';
import { PicsaDatabase_V2_Service } from './db.service';
import { ATTACHMENTS_COLLECTION, IAttachment } from './schemas/attachments';

/*********************************************************************************************
 * If storing attachments using regular `putAttachment` method all attachment data is converted
 * to base64 string and stored directly within an `attachments` objectStore on the collection
 * indexeddb. This results in very large indexeddbs which may be slow to use and difficult to migrate
 *
 * The PicsaDatabaseAttachmentService instead uses local file storage on native devices, providing
 * URIs to files on disk instead of raw data. It includes methods to convert these URIs to
 * other data types as required
 *
 * On web the service still uses indexeddb
 *
 * TODO - add support for opfs storage on web
 * TODO - may want hooks system to ensure attachments removed on doc delete
 * TODO - change all md5checksum for sha256
 * TODO - add db service hooks to also remove files on doc remove
 ********************************************************************************************/
@Injectable({ providedIn: 'root' })
export class PicsaDatabaseAttachmentService extends PicsaAsyncService {
  /** Track any generate objectURLs so that they can be removed from dom as required */
  private objectURLs: { [filename: string]: string } = {};

  constructor(
    private dbService: PicsaDatabase_V2_Service,
    private nativeStorageService: NativeStorageService,
  ) {
    super();
  }

  get collection() {
    return this.dbService.db.collections.attachments as RxCollection<IAttachment>;
  }

  public override async init() {
    await this.dbService.ensureCollections({ attachments: ATTACHMENTS_COLLECTION });
    if (Capacitor.isNativePlatform()) {
      await this.nativeStorageService.ready();
    }
  }

  /** Get a file attachment ref populated to a specific collection doc */
  private async getAttachment(doc: RxDocument<any>, filename: string) {
    const id = this.generateAttachmentID(doc, filename);
    return this.collection.findOne(id).exec();
  }

  /**
   * Retrieve a doc attachment and convert to URI for use within components
   * NOTE - on web this will create an objectURL in the document which should be revoked when no longer required
   * @param convertFileSrc - Convert into usable src for rendering in webview. Typically required for files
   * rendered in webview (images, pdf), but not for files passed to native handlers (video, native file open)
   **/
  public async getFileAttachmentURI(doc: RxDocument<any>, filename: string, convertFileSrc = true) {
    if (!filename) {
      console.error(doc);
      throw new Error(`No attachment name provided`);
    }
    const attachment = await this.getAttachment(doc, filename);
    if (!attachment) return null;
    if (attachment) {
      if (Capacitor.isNativePlatform()) {
        const { uri } = attachment;
        return convertFileSrc ? Capacitor.convertFileSrc(uri as string) : (uri as string);
      } else {
        // On web data stored as base64 string, convert to blob and generate object url
        if (attachment.data) {
          const blob = await base64ToBlob(attachment.data, attachment.type);
          this.objectURLs[filename] = URL.createObjectURL(blob);
          return this.objectURLs[filename];
        }
      }
    }
    return null;
  }

  /**
   * Release a file attachment URI when no longer required
   * @param attachmentNames specific resource attachmentNames to revoke
   * These will usually be the doc.filename property (if exists) or doc.id
   * */
  public async revokeFileAttachmentURIs(attachmentNames: string[]) {
    for (const attachmentName of attachmentNames) {
      const url = this.objectURLs[attachmentName];
      if (url) {
        URL.revokeObjectURL(url);
        delete this.objectURLs[attachmentName];
      }
    }
  }

  /**
   * Store binary data of a specified doc file attachment
   * Attachments will be stored independent of doc for performance and platform optimisation
   *
   * @param doc parent document containing file metadata
   * @param data blob data to persist to doc
   * @param prefix additional prefix to provide to filename to ensure globally unique
   * @param index doc file entry number in case of multiple files
   */
  public async putAttachment<T>(doc: RxDocument<T>, filename: string, data: Blob) {
    if (!data) {
      throw new Error('Cannot put attachment, no data: ' + filename);
    }
    // prefer to use downloaded blob data directly instead of doc expected
    const { type, size } = data;
    const id = this.generateAttachmentID(doc, filename);
    const entry: IAttachment = { id, length: size, type };
    // Native
    if (Capacitor.isNativePlatform()) {
      const result = await this.nativeStorageService.writeFile(data, id.replace('||', '/'));
      if (result) {
        entry.uri = result.uri;
      }
    }
    // Web
    else {
      // TODO - consider using opfs instead
      // https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
      // https://web.dev/indexeddb-best-practices/#not-everything-can-be-stored-in-indexeddb-on-all-platforms
      entry.data = await blobToBase64String(data);
    }
    // Combined
    const attachmentDoc = await this.collection.upsert(entry);
    // Additionally write to rxdb attachment system to trigger any observable reactions
    // NOTE - avoid writing full blob as very slow
    // TODO - can probably remove any rxdb digest refs from schemas
    await doc.putAttachment({
      id: filename,
      type,
      data: new Blob([JSON.stringify(attachmentDoc._data)], { type: 'application/json' }),
    });
    // refresh doc and return
    return doc.getLatest();
  }

  /** Remove attachments populated to a specific collection doc */
  public async removeAttachment<T>(doc: RxDocument<T>, filename: string) {
    const id = this.generateAttachmentID(doc, filename);
    const ref = await this.collection.findOne(id).exec();
    if (ref) {
      if (ref.uri) {
        try {
          await this.nativeStorageService.deleteFile(id.replace('||', '/'));
        } catch (error) {
          // File may have been manually deleted or renamed
        }
      }
      await ref.remove();
    }
    const docRef = doc.getAttachment(filename);
    if (docRef) {
      await docRef.remove();
    }
    return doc.getLatest();
  }

  /**
   * Generate unique id composed of doc collection name and filename
   * Mimics rxdb convention (although recommend file-based storage should replace separator)
   * */
  private generateAttachmentID(doc: RxDocument<any>, filename: string) {
    return `${doc.collection.name}||${filename}`;
  }
}
