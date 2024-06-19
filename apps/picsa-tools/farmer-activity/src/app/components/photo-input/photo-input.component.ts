import { Platform } from '@angular/cdk/platform';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

// Temporary service to simulate the photo service that will handle the photo input and output.
import { PhotoService } from '../../services/photo-input.service';

interface Photo {
  webPath?: string;
}

@Component({
  selector: 'farmer-activity-photo-input',
  templateUrl: './photo-input.component.html',
  styleUrls: ['./photo-input.component.scss'],
})
export class PhotoInputComponent implements OnInit {
  @ViewChild('fileInput') fileInput: ElementRef;
  photos: Photo[] = [];
  isWebPlatform: boolean;

  constructor(private platform: Platform, private photoService: PhotoService) {}

  ngOnInit() {
    this.isWebPlatform = this.platform.isBrowser;
  }

  async takeOrChoosePicture() {
    const source = this.isWebPlatform ? CameraSource.Photos : CameraSource.Prompt;
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
