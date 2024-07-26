/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

import { PhotoService } from './photo-input.service';

interface Photo {
  webPath?: string;
}

@Component({
  selector: 'picsa-photo-input',
  templateUrl: './photo-input.component.html',
  styleUrls: ['./photo-input.component.scss'],
})
export class PicsaPhotoInputComponent {
  @ViewChild('fileInput') fileInput: ElementRef;
  @Input() activityId: string;
  photos: Photo[] = [];

  public isWebPlatform = Capacitor.getPlatform() === 'web';

  constructor(private photoService: PhotoService) {}

  async ngOnInit() {
    await this.photoService.init();
    await this.loadPhotos();
    console.info('Photos:', this.photos);
  }

  // this method will be called when a user clicks the camera button
  async takeOrChoosePicture() {
    const platform = Capacitor.getPlatform();
    const source = platform === 'web' ? CameraSource.Photos : CameraSource.Prompt;

    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: source,
    });

    this.photos.push({
      webPath: image.webPath,
    });

    // Save the photo to the database
    const photoEntry = {
      id: `${this.activityId}_${generateID()}`,
      activity: this.activityId,
      photoData: image.webPath || '',
      timestamp: Date.now(),
    };
    await this.photoService.savePhoto(photoEntry);
  }

  // this method will be called when a user selects a photo from the file input
  processWebPicture(event: any) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const photo = { webPath: e.target?.result as string };
      this.photos.push(photo);

      // Save the photo to the database
      const photoEntry = {
        id: `${this.activityId}_${generateID()}`,
        activity: this.activityId,
        photoData: photo.webPath,
        timestamp: Date.now(),
      };
      await this.photoService.savePhoto(photoEntry);
    };
    reader.readAsDataURL(file);
  }

  // this method will load the photos from the database
  async loadPhotos() {
    this.photos = await this.photoService.getAllPhotos(this.activityId);
  }

  removePhoto(index: number) {
    return;
  }

  removeAllPhotos() {
    return;
  }
}

// this function will generate a random
function generateID(length = 20, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
  let autoId = '';
  for (let i = 0; i < length; i++) {
    autoId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return autoId;
}
