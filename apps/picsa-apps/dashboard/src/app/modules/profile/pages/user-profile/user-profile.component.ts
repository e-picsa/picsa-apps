import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

import { DashboardAuthService } from '../../../auth/services/auth.service';
import { DeploymentItemComponent } from '../../../deployment/components/deployment-item/deployment-item.component';
import { DeploymentDashboardService } from '../../../deployment/deployment.service';

@Component({
  selector: 'dashboard-user-profile',
  imports: [DeploymentItemComponent, MatCheckboxModule, MatButtonModule, MatIconModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileComponent {
  authService = inject(DashboardAuthService);
  deploymentService = inject(DeploymentDashboardService);

  public authRoleLevels = ['viewer', 'author', 'admin'];
  public authRoleFeatures: string[] = [];
  constructor() {
    effect(() => {
      const authRoleFeatures: string[] = [];

      const roles = this.authService.authRoles();
      for (const role of roles) {
        const [feature] = role.split('.');
        if (!authRoleFeatures.includes(feature)) authRoleFeatures.push(feature);
      }
      this.authRoleFeatures = authRoleFeatures;
    });
  }
}
