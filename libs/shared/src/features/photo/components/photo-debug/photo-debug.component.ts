import { Component } from '@angular/core';

import { PhotoInputComponent } from '../photo-input/photo-input.component';
import { PhotoListComponent } from '../photo-list/photo-list.component';
import { PhotoViewComponent } from '../photo-view/photo-view.component';

@Component({
  selector: 'picsa-photo-debug',
  standalone: true,
  imports: [PhotoInputComponent, PhotoListComponent, PhotoViewComponent],
  templateUrl: './photo-debug.component.html',
  styleUrl: './photo-debug.component.scss',
})
export class PhotoDebugComponent {}
