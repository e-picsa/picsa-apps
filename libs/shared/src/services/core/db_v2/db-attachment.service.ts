import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
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
 * TODO - add db service hooks to also remove files
 ********************************************************************************************/
@Injectable({ providedIn: 'root' })
export class PicsaDatabaseAttachmentService extends PicsaAsyncService {
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
    // prefer to use downloaded blob data directly instead of doc expected
    const { type, size } = data;
    const id = this.getAttachmentId(doc, filename);
    const entry: IAttachment = { id, length: size, type };
    // TODO - handle native better to write to disk and get url
    if (Capacitor.isNativePlatform()) {
      const result = await this.nativeStorageService.writeFile(data, id.replace('||', '/'));
      if (result) {
        entry.uri = result.uri;
      }
    } else {
      // RXDB converts blobs to string, which has more support on safari/ios
      // https://web.dev/indexeddb-best-practices/#not-everything-can-be-stored-in-indexeddb-on-all-platforms
      entry.data = await blobToBase64String(data);
    }
    // Write data to attachments collection on web
    const attachmentDoc = await this.collection.upsert(entry);
    // Additionally write to rxdb attachment system to trigger any observable reactions
    const { digest } = await doc.putAttachment({ id: filename, type, data });
    await attachmentDoc.patch({ digest });
  }
  /** Get a file attachment ref populated to a specific collection doc */
  public async getAttachment(doc: RxDocument<any>, filename: string) {
    const id = this.getAttachmentId(doc, filename);
    return this.collection.findOne(id).exec();
  }
  /** Remove attachments populated to a specific collection doc */
  public async removeAttachment(doc: RxDocument<any>, filename: string) {
    const id = this.getAttachmentId(doc, filename);
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
  private getAttachmentId(doc: RxDocument<any>, filename: string) {
    return `${doc.collection.name}||${filename}`;
  }
}
