import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { blobToBase64String, createBlobFromBase64, RxCollection, RxDocument } from 'rxdb';

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
      // TODO
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
  /** Get a file attachment populated to a specific collection doc */
  public async getAttachment(doc: RxDocument<any>, filename: string) {
    const id = this.getAttachmentId(doc, filename);
    const ref = await this.collection.findOne(id).exec();
    if (ref) {
      // use rxdb method to convert back from base64 string to blob
      // TODO - do we actually want to be using blobs?
      const dataBase64 = ref.data;
      if (dataBase64) {
        const blob = await createBlobFromBase64(dataBase64, ref.type);
        return blob;
      }
    }
    return null;
  }
  /** Remove attachments populated to a specific collection doc */
  public async removeAttachments(doc: RxDocument<any>, filename: string) {
    const id = this.getAttachmentId(doc, filename);
    const ref = await this.collection.findOne(id).exec();
    if (ref) {
      await ref.remove();
    }
    const docRef = doc.getAttachment(filename);
    if (docRef) {
      await docRef.remove();
    }
  }

  private getAttachmentId(doc: RxDocument<any>, filename: string) {
    return `${doc.collection.name}||${filename}`;
  }
}
