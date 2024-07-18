import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { PicsaTranslateModule } from '../../modules';
import { PicsaPhotoInputComponent } from './photo-input.component';

@NgModule({
  imports: [CommonModule, MatButtonModule, MatIconModule, PicsaTranslateModule],
  exports: [PicsaPhotoInputComponent],
  declarations: [PicsaPhotoInputComponent],
  providers: [],
})
export class PicsaPhotoInputModule {}
