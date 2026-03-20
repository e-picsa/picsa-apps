/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { isEqual } from '@picsa/utils/object.utils';
import JSZip from 'jszip';
import { RxCollection, RxDocument } from 'rxdb';

import { PicsaAsyncService } from '../../services/asyncService.service';
import { PicsaDatabase_V2_Service, PicsaDatabaseAttachmentService } from '../../services/core/db_v2';
import { PicsaNotificationService } from '../../services/core/notification.service';
import { NativeStorageService } from '../../services/native';
import * as Schema from './schema';

@Injectable({
  providedIn: 'root',
})
export class PhotoService extends PicsaAsyncService {
  private readonly shareUnavailableMessage = 'Photo could not be shared right now.';
  private dbService = inject(PicsaDatabase_V2_Service);
  private attachmentService = inject(PicsaDatabaseAttachmentService);
  private notificationService = inject(PicsaNotificationService);
  private nativeStorageService = inject(NativeStorageService);

  public collection: RxCollection<Schema.IPhotoEntry>;

  /** List of all stored photos, exposed as signal */
  public photos = signal<Schema.IPhotoEntry[]>([], { equal: isEqual });

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
    try {
      const shareablePhotos = await this.getShareablePhotos(ids);
      if (!shareablePhotos.length) {
        this.notificationService.showErrorNotification(this.shareUnavailableMessage);
        return false;
      }

      const title =
        shareablePhotos.length === 1 ? this.getPhotoTitle(shareablePhotos[0].doc) : `${shareablePhotos.length} Photos`;
      const text = 'Shared from Picsa App';

      if (Capacitor.isNativePlatform()) {
        const files = await Promise.all(
          shareablePhotos.map(async ({ uri }) => this.nativeStorageService.copyFileToCache(uri)),
        );
        const cacheFiles = files.filter((fileUri): fileUri is string => !!fileUri);
        if (!cacheFiles.length) {
          this.notificationService.showErrorNotification(this.shareUnavailableMessage);
          return false;
        }

        await Share.share({
          files: cacheFiles,
          title,
          text,
          dialogTitle: 'Share Photo',
        });
        return true;
      }

      const files = await Promise.all(
        shareablePhotos.map(async ({ doc, uri }) => {
          const response = await fetch(uri);
          const blob = await response.blob();
          return new File([blob], this.getPhotoFilename(doc), { type: blob.type || 'image/jpeg' });
        }),
      );

      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files })
      ) {
        await navigator.share({
          files,
          title,
          text,
        });
        return true;
      }

      await this.downloadPhotos(shareablePhotos);
      this.notificationService.showErrorNotification(
        'Sharing photos is not supported in this browser. The image was downloaded instead.',
      );
      return false;
    } catch (error) {
      console.error('[Photo] Share failed', error);
      this.notificationService.showErrorNotification(this.shareUnavailableMessage);
      return false;
    }
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

  private getPhotoTitle(doc: RxDocument<Schema.IPhotoEntry>) {
    return doc.name || this.getPhotoFilename(doc);
  }

  private getPhotoFilename(doc: RxDocument<Schema.IPhotoEntry>) {
    const fallbackName = doc.id.split('/').pop() || 'photo';
    return fallbackName.includes('.') ? fallbackName : `${fallbackName}.jpg`;
  }

  private async getShareablePhotos(ids: string[]) {
    const photos = await Promise.all(
      ids.map(async (id) => {
        const doc = await this.collection.findOne(id).exec();
        if (!doc) return null;
        const uri = await this.getPhotoAttachment(id, !Capacitor.isNativePlatform());
        if (!uri) return null;
        return { doc, uri };
      }),
    );
    return photos.filter((photo): photo is { doc: RxDocument<Schema.IPhotoEntry>; uri: string } => !!photo);
  }

  private async downloadPhotos(photos: Array<{ doc: RxDocument<Schema.IPhotoEntry>; uri: string }>) {
    if (photos.length > 1) {
      await this.downloadPhotoArchive(photos);
      return;
    }

    for (const { doc, uri } of photos) {
      const link = document.createElement('a');
      link.href = uri;
      link.download = this.getPhotoFilename(doc);
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  }

  private async downloadPhotoArchive(photos: Array<{ doc: RxDocument<Schema.IPhotoEntry>; uri: string }>) {
    const zip = new JSZip();
    await Promise.all(
      photos.map(async ({ doc, uri }) => {
        const response = await fetch(uri);
        const blob = await response.blob();
        zip.file(this.getPhotoFilename(doc), blob);
      }),
    );

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const archiveUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = archiveUrl;
    link.download = 'picsa-photos.zip';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(archiveUrl);
  }
}
