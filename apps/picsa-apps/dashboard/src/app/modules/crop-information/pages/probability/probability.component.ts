import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'dashboard-crop-probability',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './probability.component.html',
  styleUrl: './probability.component.scss',
})
export class CropProbabilityComponent {}
