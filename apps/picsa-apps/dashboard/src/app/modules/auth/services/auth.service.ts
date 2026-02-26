import { computed, inject, Injectable, signal } from '@angular/core';
import { AppRole } from '@picsa/server-types';
import { assignImplicitRoles } from '@picsa/server-utils';
import { SupabaseAuthService } from '@picsa/shared/services/core/supabase/services/supabase-auth.service';

/**
 * Authentication and user permission handling
 * Adapts Supabase auth to include deployment-specific user role-based-access controls
 */
@Injectable({ providedIn: 'root' })
export class DashboardAuthService {
  private supabaseAuthService = inject(SupabaseAuthService);
  private activeDeploymentId = signal<string | undefined>(undefined);

  public authUser = this.supabaseAuthService.authUser;

  /** Auth roles for all deployments */
  public rolesByDeploymentId = computed(() => this.authUser()?.picsa_roles);

  public authUserId = computed(() => this.supabaseAuthService.authUser()?.id);
  public isAuthChecked = this.supabaseAuthService.isAuthChecked;

  /** Active auth roles for current deployment **/
  public readonly authRoles = computed<AppRole[]>(() => {
    const deploymentId = this.activeDeploymentId();
    const rolesByDeploymentId = this.rolesByDeploymentId();
    if (deploymentId && rolesByDeploymentId) {
      const authRoles: AppRole[] = rolesByDeploymentId[deploymentId] || [];
      return assignImplicitRoles(authRoles);
    }
    return [];
  });

  public hasRole(requiredRole?: AppRole): boolean {
    if (!requiredRole) return true;
    const deploymentRoles = this.authRoles();
    if (!deploymentRoles) return false;

    return deploymentRoles.includes(requiredRole);
  }

  public async reloadPermissions() {
    return this.supabaseAuthService.reloadUserPermissions();
  }
}
