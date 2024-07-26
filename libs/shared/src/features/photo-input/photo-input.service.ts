/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { RxCollection } from 'rxdb';

import { PicsaAsyncService } from '../../services/asyncService.service';
import { PicsaDatabase_V2_Service, PicsaDatabaseAttachmentService } from '../../services/core/db_v2';
import * as Schema from './schema';

interface Photo {
  webPath: string;
}

@Injectable({
  providedIn: 'root',
})
export class PhotoService extends PicsaAsyncService {
  private dbService: PicsaDatabase_V2_Service;
  private collection: RxCollection<Schema.IPhotoEntry>;

  constructor(dbService: PicsaDatabase_V2_Service, private attachmentService: PicsaDatabaseAttachmentService) {
    super();
    this.dbService = dbService;
  }

  override async init() {
    try {
      await this.dbService.ensureCollections({ [Schema.COLLECTION_NAME]: Schema.COLLECTION });
      this.collection = this.dbService.db.collections[Schema.COLLECTION_NAME] as RxCollection<Schema.IPhotoEntry>;
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  // this method will save the photo to the database.
  async savePhoto(photo: Schema.IPhotoEntry) {
    try {
      const photoBlob = await this.getPhotoBlob(photo.photoData);
      const doc = await this.collection.insert(photo);
      console.info('Document inserted:', doc);
      await this.attachmentService.putAttachment(doc, photo.id, photoBlob);
    } catch (error) {
      console.error('Failed to save photo:', error);
    }
  }

  // this method will get the photos from the database.
  async getAllPhotos(activityId: string): Promise<Photo[]> {
    if (!this.collection) {
      console.error('Photos collection is not initialized.');
      return [];
    }
    const allPhotos = await this.collection.find().where('activity').eq(activityId).exec();
    console.info('Photos:', allPhotos);

    const photos: Photo[] = [];
    for (const photo of allPhotos) {
      const uri = await this.attachmentService.getFileAttachmentURI(photo, true);
      if (uri) {
        photos.push({ webPath: uri });
      }
    }
    return photos;
  }

  // this method will delete a photo from the database.
  async deletePhoto(id: string) {
    try {
      const doc = await this.collection.findOne(id).exec();
      if (doc) {
        await this.attachmentService.removeAttachment(doc, id);
        await doc.remove();
        console.info('Photo deleted:', id);
      }
    } catch (error) {
      console.error('Failed to delete photo:', error);
    }
  }

  // this method will delete all photos from the database.
  async deleteAllPhotos() {
    try {
      const docs = await this.collection.find().exec();
      for (const doc of docs) {
        await this.attachmentService.removeAttachment(doc, doc.id);
        await doc.remove();
      }
      console.info('All photos deleted');
    } catch (error) {
      console.error('Failed to delete all photos:', error);
    }
  }

  // this method will get the photo as a Blob.
  private async getPhotoBlob(photoData: string): Promise<Blob> {
    const response = await fetch(photoData);
    return response.blob();
  }
}
