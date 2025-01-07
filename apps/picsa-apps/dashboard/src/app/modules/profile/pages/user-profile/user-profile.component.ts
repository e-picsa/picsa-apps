import { Component, effect } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { DashboardAuthService } from '../../../auth/services/auth.service';
import { DeploymentItemComponent } from '../../../deployment/components/deployment-item/deployment-item.component';
import { DeploymentDashboardService } from '../../../deployment/deployment.service';

@Component({
  selector: 'dashboard-user-profile',
  imports: [DeploymentItemComponent, MatCheckboxModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
})
export class UserProfileComponent {
  public authRoleLevels = ['viewer', 'author', 'admin'];
  public authRoleFeatures: string[] = [];
  constructor(public authService: DashboardAuthService, public deploymentService: DeploymentDashboardService) {
    effect(() => {
      const authRoleFeatures: string[] = [];

      const roles = this.authService.authRoles();
      for (const role of roles) {
        const [feature, level] = role.split('.');
        if (!authRoleFeatures.includes(feature)) authRoleFeatures.push(feature);
      }
      this.authRoleFeatures = authRoleFeatures;
    });
  }
}
