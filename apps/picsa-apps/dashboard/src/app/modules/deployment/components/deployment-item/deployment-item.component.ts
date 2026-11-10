import { ChangeDetectionStrategy, Component, input } from '@angular/core';
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
  readonly deployment = input.required<IDeploymentRow>();
  /** Specify whether the current deployment item is actively selected */
  readonly active = input<boolean>();
}
