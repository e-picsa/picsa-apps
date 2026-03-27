/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, inject, Injectable, signal } from '@angular/core';
import { _wait } from '@picsa/utils';
import { isEqual } from '@picsa/utils/object.utils';
import { RxCollection, RxDocument } from 'rxdb';

import { PicsaAsyncService } from '../../services/asyncService.service';
import { PicsaDatabase_V2_Service, PicsaDatabaseAttachmentService } from '../../services/core/db_v2';
import { IAttachment } from '../../services/core/db_v2/schemas/attachments';
import { PicsaNotificationService } from '../../services/core/notification.service';
import { ShareService } from '../../services/core/share.service';
import * as Schema from './schema';

@Injectable({
  providedIn: 'root',
})
export class PhotoService extends PicsaAsyncService {
  private dbService = inject(PicsaDatabase_V2_Service);
  private attachmentService = inject(PicsaDatabaseAttachmentService);
  private notificationService = inject(PicsaNotificationService);
  private shareService = inject(ShareService);

  public collection: RxCollection<Schema.IPhotoEntry>;

  private photoDocs = signal<RxDocument<Schema.IPhotoEntry>[]>([]);

  /** List of all stored photos, exposed as signal */
  public photos = computed<Schema.IPhotoEntry[]>(() => this.photoDocs().map((v) => v._data), { equal: isEqual });

  public isSharingPhotos = signal(false);

  override async init() {
    try {
      await this.dbService.ensureCollections({ photos: Schema.COLLECTION });
      this.collection = this.dbService.db.collections.photos as RxCollection<Schema.IPhotoEntry>;
      this.subscribeToPhotos();
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  public async getPhotoAttachment(id: string, convertFileSrc = true) {
    const doc = await this.collection.findOne(id).exec();
    if (doc) {
      return this.attachmentService.getFileAttachmentURI(doc, id, convertFileSrc);
    }
    return undefined;
  }

  public async sharePhoto(id: string) {
    return this.sharePhotos([id]);
  }

  public async sharePhotos(ids: string[]) {
    this.isSharingPhotos.set(true);
    await _wait(50);
    const photoDocs = this.photoDocs().filter((v) => ids.includes(v.id));

    try {
      const photoAttachments: RxDocument<IAttachment>[] = [];
      for (const doc of photoDocs) {
        // photos are stored as attachment in separate doc
        const attachmentDoc = await this.attachmentService.getAttachmentDoc(doc, doc.id);
        if (attachmentDoc) {
          photoAttachments.push(attachmentDoc);
        }
      }
      console.log({ photoAttachments });
      if (photoAttachments.length === 0) {
        this.notificationService.showErrorNotification(`Cannot share photos`);
        return;
      }
      await this.shareService.shareFromAttachments(photoAttachments);
    } catch (error: any) {
      console.error(error);
      this.notificationService.showErrorNotification(error?.message);
    } finally {
      this.isSharingPhotos.set(false);
    }
  }

  public revokePhotoAttachment(id: string) {
    this.attachmentService.revokeFileAttachmentURIs([id]);
  }

  /** Subscribe to all photos and store list within angular signal */
  private subscribeToPhotos() {
    this.collection.find().$.subscribe((docs) => {
      // as photo docs are updated before attachment stored filter to only include those
      // that have had attachment added
      const withAttachments = docs.filter((doc) => doc.allAttachments().length > 0);
      this.photoDocs.set(withAttachments);
    });
  }

  // this method will save the photo to the database.
  async savePhoto(entry: Schema.IPhotoEntry, data: Blob) {
    try {
      // create new doc in photos
      const photoDoc = await this.collection.insert(entry);
      // update the doc with reference to stored attachment
      const updatedDoc = await this.attachmentService.putAttachment(photoDoc, entry.id, data);
      return updatedDoc;
    } catch (error) {
      console.error('Failed to save photo:', error);
      return;
    }
  }

  // this method will delete a photo from the database.
  async deletePhoto(id: string) {
    const photoDoc = await this.collection.findOne(id).exec();
    if (!photoDoc) return;
    const updatedDoc = await this.attachmentService.removeAttachment(photoDoc, id);
    return updatedDoc;
  }
}
