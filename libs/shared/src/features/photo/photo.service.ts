/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, signal } from '@angular/core';
import { isEqual } from '@picsa/utils/object.utils';
import { RxCollection } from 'rxdb';

import { PicsaAsyncService } from '../../services/asyncService.service';
import { PicsaDatabase_V2_Service, PicsaDatabaseAttachmentService } from '../../services/core/db_v2';
import * as Schema from './schema';

@Injectable({
  providedIn: 'root',
})
export class PhotoService extends PicsaAsyncService {
  public collection: RxCollection<Schema.IPhotoEntry>;

  /** List of all stored photos, exposed as signal */
  public photos = signal<Schema.IPhotoEntry[]>([], { equal: isEqual });

  constructor(
    private dbService: PicsaDatabase_V2_Service,
    private attachmentService: PicsaDatabaseAttachmentService,
  ) {
    super();
  }

  override async init() {
    try {
      await this.dbService.ensureCollections({ photos: Schema.COLLECTION });
      this.collection = this.dbService.db.collections.photos as RxCollection<Schema.IPhotoEntry>;
      this.subscribeToPhotos();
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  public async getPhotoAttachment(id: string) {
    const doc = await this.collection.findOne(id).exec();
    if (doc) {
      return this.attachmentService.getFileAttachmentURI(doc, id);
    }
    return undefined;
  }
  public revokePhotoAttachment(id: string) {
    this.attachmentService.revokeFileAttachmentURIs([id]);
  }

  /** Subscribe to all photos and store list within angular signal */
  private subscribeToPhotos() {
    this.collection.find().$.subscribe((docs) => {
      const photos = docs.map((d) => d._data);
      // as photo docs are updated before attachment stored filter to only include those that have
      // had attachment added
      const photosWithAttachments = photos.filter((p) => (p._attachments[p.id] ? true : false));
      this.photos.set(photosWithAttachments);
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
