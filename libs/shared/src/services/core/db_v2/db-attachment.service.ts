import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { base64ToBlob } from '@picsa/utils';
import { blobToBase64String, RxCollection, RxDocument } from 'rxdb';

import { PicsaAsyncService } from '../../asyncService.service';
import { NativeStorageService } from '../../native';
import { PicsaDatabase_V2_Service } from './db.service';
import { ATTACHMENTS_COLLECTION, IAttachment } from './schemas/attachments';

/*********************************************************************************************
 * DB Attachments
 * Ordinarily RXDB handles attachments within the storage provider, however dexie is not
 * currently supported. So manual workaround to persist attachment files to separate collection
 * instead and retrieve on demand.
 * Additionally writes to disk on native
 *
 * TODO - may want hooks system to ensure attachments removed on doc delete
 * TODO - change all md5checksum for sha256
 * TODO - add db service hooks to also remove files on doc remove
 ********************************************************************************************/
@Injectable({ providedIn: 'root' })
export class PicsaDatabaseAttachmentService extends PicsaAsyncService {
  /** Track any generate objectURLs so that they can be removed from dom as required */
  private objectURLs: { [filename: string]: string } = {};

  constructor(private dbService: PicsaDatabase_V2_Service, private nativeStorageService: NativeStorageService) {
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
   * @param convertNativeSrc - Convert to src usable within web content (e.g as image or pdf src)
   **/
  public async getFileAttachmentURI(doc: RxDocument<any>, convertNativeSrc = false) {
    const attachment = await this.getAttachment(doc, doc.filename);
    if (!attachment) return null;
    if (attachment) {
      if (Capacitor.isNativePlatform()) {
        const { uri } = attachment;
        return convertNativeSrc ? Capacitor.convertFileSrc(uri as string) : uri;
      }
      // On native URI already stored as path to file stored locally
      if (attachment.uri) return attachment.uri;
      // On web data stored as base64 string, convert to blob and generate object url
      if (attachment.data) {
        const blob = await base64ToBlob(attachment.data, attachment.type);
        this.objectURLs[doc.filename] = URL.createObjectURL(blob);
        return this.objectURLs[doc.filename];
      }
    }
    return null;
  }
  /**
   * Release a file attachment URI when no longer required
   * @param filenames specific resource filenames to revoke (default all)
   * */
  public async revokeFileAttachmentURIs(filenames: string[]) {
    for (const filename of filenames) {
      const url = this.objectURLs[filename];
      if (url) {
        URL.revokeObjectURL(url);
        delete this.objectURLs[filename];
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
  public async putAttachment(doc: RxDocument<any>, filename: string, data: Blob) {
    if (!data) return;
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
      // RXDB converts blobs to string, which has more support on safari/ios
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
    // await attachmentDoc.patch({ digest });
  }

  /** Remove attachments populated to a specific collection doc */
  public async removeAttachment(doc: RxDocument<any>, filename: string) {
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
  }

  /**
   * Generate unique id composed of doc collection name and filename
   * Mimics rxdb convention (although recommend file-based storage should replace separator)
   * */
  private generateAttachmentID(doc: RxDocument<any>, filename: string) {
    return `${doc.collection.name}||${filename}`;
  }
}
