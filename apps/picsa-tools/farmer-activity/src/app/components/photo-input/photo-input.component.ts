import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { PhotoService } from './photo-input.service';

interface Photo {
  webPath?: string;
}

@Component({
  selector: 'picsa-photo-input',
  templateUrl: './photo-input.component.html',
  styleUrls: ['./photo-input.component.scss'],
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, PicsaTranslateModule],
})
export class PicsaPhotoInputComponent {
  @ViewChild('fileInput') fileInput: ElementRef;
  photos: Photo[] = [];

  public isWebPlatform = Capacitor.getPlatform() === 'web';

  constructor(private photoService: PhotoService) {}

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
  }

  processWebPicture(event: any) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const photo = { webPath: e.target?.result as string };
      this.photos.push(photo);
    };
    reader.readAsDataURL(file);
  }

  removePhoto(index: number) {
    this.photos.splice(index, 1);
  }

  removeAllPhotos() {
    this.photos = [];
  }
}
