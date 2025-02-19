/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, signal } from '@angular/core';
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
  public photos = signal<Schema.IPhotoEntry[]>([]);

  constructor(private dbService: PicsaDatabase_V2_Service, private attachmentService: PicsaDatabaseAttachmentService) {
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
      return this.attachmentService.getFileAttachmentURI(doc, true);
    }
    return undefined;
  }
  public revokePhotoAttachment(id: string) {
    this.attachmentService.revokeFileAttachmentURIs([id]);
  }

  /** Subscribe to all photos and store list within angular signal */
  private subscribeToPhotos() {
    this.collection.find().$.subscribe((docs) => {
      this.photos.set(docs.map((d) => d._data));
    });
  }

  // this method will save the photo to the database.
  async savePhoto(entry: Schema.IPhotoEntry, data: Blob) {
    try {
      const doc = await this.collection.insert(entry);
      await this.attachmentService.putAttachment(doc, entry.id, data);
    } catch (error) {
      console.error('Failed to save photo:', error);
    }
  }

  // this method will delete a photo from the database.
  async deletePhoto(id: string) {
    let doc = await this.collection.findOne(id).exec();
    if (doc) {
      await this.attachmentService.removeAttachment(doc, id);
      // HACK - fetch the doc again as revision will have changed following
      // attachment removal
      doc = await this.collection.findOne(id).exec();
      if (doc) {
        await doc.remove();
      }
    }
  }
}
