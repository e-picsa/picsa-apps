import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import { PicsaPhotoInputComponent } from '../photo-input/photo-input.component';

@Component({
  selector: 'picsa-photo-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, PicsaPhotoInputComponent],
  templateUrl: './photo-list.component.html',
  styleUrl: './photo-list.component.scss',
})
export class PicsaPhotoListComponent {}
