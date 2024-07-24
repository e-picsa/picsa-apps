import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'picsa-photo-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './photo-list.component.html',
  styleUrl: './photo-list.component.scss',
})
export class PhotoListComponent {}
