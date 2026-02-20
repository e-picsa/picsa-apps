import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
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
  imports: [
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatToolbarModule,
    MatIconModule,
    ProfileMenuComponent,
    StoragePathPipe,
  ],
})
export class DeploymentSelectLayoutComponent {
  public service = inject(DeploymentDashboardService);

  public availableDeployments = computed(() => {
    const all = this.service.allDeployments();
    const user = this.service.userDeployments();
    const userIds = user.map((d) => d.id);
    return all.filter((d) => !userIds.includes(d.id));
  });
}
