import { computed, Injectable } from '@angular/core';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import {
  IAuthRole,
  IAuthUser,
  SupabaseAuthService,
} from '@picsa/shared/services/core/supabase/services/supabase-auth.service';

import { DeploymentDashboardService } from '../../deployment/deployment.service';
import { IDeploymentRow } from '../../deployment/types';

/**
 * Authentication and user permission handling
 * Adapts Supabase auth to include deployment-specific user role-based-access controls
 */
@Injectable({ providedIn: 'root' })
export class DashboardAuthService extends PicsaAsyncService {
  public authUser = this.supabaseAuthService.authUser;

  public readonly authRoles = computed<IAuthRole[]>(() => {
    const deployment = this.deploymentService.activeDeployment();
    const user = this.supabaseAuthService.authUser();
    return this.getAuthRoles(deployment, user);
  });

  constructor(private deploymentService: DeploymentDashboardService, private supabaseAuthService: SupabaseAuthService) {
    super();
  }

  public override async init() {
    await this.supabaseAuthService.ready();
  }

  private getAuthRoles(deployment: IDeploymentRow | null, user: IAuthUser | undefined) {
    if (!deployment) return [];
    if (!user) return [];
    const authRoles = user.picsa_roles[deployment.id] || [];
    // assign default roles to all deployments
    const defaultRoles: IAuthRole[] = ['resources.viewer', 'translations.viewer'];
    const implicitRoles: IAuthRole[] = [];
    for (const role of authRoles) {
      const [feature, level] = role.split('.');
      // assign implicit auth roles (anything lower than current level)
      if (level === 'admin') {
        implicitRoles.push(`${feature}.author` as IAuthRole);
      }
      if (level === 'admin' || level === 'author') {
        implicitRoles.push(`${feature}.viewer` as IAuthRole);
      }
    }
    const uniqueRoles = new Set([...defaultRoles, ...authRoles, ...implicitRoles]);
    return [...uniqueRoles];
  }
}
