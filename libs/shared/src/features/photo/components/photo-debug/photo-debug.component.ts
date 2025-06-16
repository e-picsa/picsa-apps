import { Component } from '@angular/core';

import { PhotoInputComponent } from '../photo-input/photo-input.component';
import { PhotoListComponent } from '../photo-list/photo-list.component';

@Component({
  selector: 'picsa-photo-debug',
  imports: [PhotoInputComponent, PhotoListComponent],
  templateUrl: './photo-debug.component.html',
  styleUrl: './photo-debug.component.scss',
})
export class PhotoDebugComponent {}
