/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, ElementRef, Input, input, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { PhotoService } from '../../photo.service';
import { ENTRY_TEMPLATE } from '../../schema';

@Component({
  selector: 'picsa-photo-input',
  templateUrl: './photo-input.component.html',
  styleUrls: ['./photo-input.component.scss'],
  standalone: true,
  imports: [PicsaTranslateModule, MatButtonModule, MatIconModule],
})
export class PhotoInputComponent {
  @ViewChild('fileInput') fileInput: ElementRef;
  /** Store photo within a specific named album */
  album = input.required<string>();
  /**
   * Name to store photo as. If unspecified will be randomly generated
   * If duplicate will override
   */
  name = input<string>();

  constructor(private photoService: PhotoService) {}

  async ngOnInit() {
    await this.photoService.init();
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

    if (image.webPath) {
      const fetchRes = await fetch(image.webPath);
      const blob = await fetchRes.blob();
      const entry = ENTRY_TEMPLATE(this.album(), this.name());
      await this.photoService.savePhoto(entry, blob);
    }
  }
}
