import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { StoragePathPipe } from '@picsa/shared/services/core/supabase';

import { IDeploymentRow } from '../../types';

/** UI deployment display, consisting of icon and label */
@Component({
  selector: 'dashboard-deployment-item',
  imports: [StoragePathPipe],
  templateUrl: './deployment-item.component.html',
  styleUrl: './deployment-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeploymentItemComponent {
  @Input() deployment: IDeploymentRow;
  /** Specify whether the current deployment item is actively selected */
  @Input() active: boolean;
}
