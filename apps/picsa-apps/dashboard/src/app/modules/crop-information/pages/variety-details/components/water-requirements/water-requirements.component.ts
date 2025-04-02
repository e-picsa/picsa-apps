import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'dashboard-crop-water-requirements',
  imports: [CommonModule],
  templateUrl: './water-requirements.component.html',
  styleUrl: './water-requirements.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardCropWaterRequirementsComponent {}
