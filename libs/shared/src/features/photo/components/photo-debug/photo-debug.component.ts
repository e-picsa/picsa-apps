import { Component, inject, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { PhotoService } from '../../photo.service';
import { PhotoInputComponent } from '../photo-input/photo-input.component';
import { PhotoListComponent } from '../photo-list/photo-list.component';

@Component({
  selector: 'picsa-photo-debug',
  imports: [PhotoInputComponent, PhotoListComponent, MatButtonModule, MatIconModule],
  templateUrl: './photo-debug.component.html',
  styleUrl: './photo-debug.component.scss',
})
export class PhotoDebugComponent {
  public service = inject(PhotoService);

  private photoList = viewChild.required(PhotoListComponent);

  public async handlePhotoShareClick() {
    const photos = this.photoList().selectedPhotos();
    // If clicked without selection toggle all photo selection
    // and wait for user to confirm by clicking a second time
    if (photos.length === 0) {
      this.photoList().selectAll();
    } else {
      this.service.sharePhotos(this.photoList().selectedPhotoIds());
    }
  }
}
