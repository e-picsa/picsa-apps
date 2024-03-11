import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {getStroke} from 'perfect-freehand'

@Component({
  selector: 'picsa-custom-drawing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drawing.component.html',
  styleUrls: ['./drawing.component.scss'],
})
export class DrawingComponent {}
