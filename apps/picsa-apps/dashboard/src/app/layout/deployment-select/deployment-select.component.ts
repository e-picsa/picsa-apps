import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { StoragePathPipe } from '@picsa/shared/services/core/supabase';

import { DeploymentDashboardService } from '../../modules/deployment/deployment.service';
import { ProfileMenuComponent } from '../../modules/profile/components/profile-menu/profile-menu.component';

@Component({
  selector: 'dashboard-deployment-select-layout',
  templateUrl: 'deployment-select.component.html',
  styleUrl: './deployment-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, MatButtonModule, MatCardModule, MatToolbarModule, ProfileMenuComponent, StoragePathPipe],
})
export class DeploymentSelectLayoutComponent {
  public service = inject(DeploymentDashboardService);
}
