import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { DeploymentDashboardService } from '../../deployment.service';
import { DeploymentItemComponent } from '../deployment-item/deployment-item.component';

@Component({
  selector: 'dashboard-deployment-select',
  imports: [DeploymentItemComponent, MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './deployment-select.component.html',
  styleUrls: ['./deployment-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeploymentSelectComponent {
  public service = inject(DeploymentDashboardService);
}
