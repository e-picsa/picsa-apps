import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { StoragePathPipe } from '@picsa/shared/services/core/supabase';

import { IDeploymentRow } from '../../types';

/** UI deployment display, consisting of icon and label */
@Component({
  selector: 'dashboard-deployment-item',
  standalone: true,
  imports: [CommonModule, StoragePathPipe],
  templateUrl: './deployment-item.component.html',
  styleUrl: './deployment-item.component.scss',
})
export class DeploymentItemComponent {
  @Input() deployment: IDeploymentRow;
}
