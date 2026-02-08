import { computed, inject, Injectable, signal } from '@angular/core';
import { assignImplicitRoles } from '@picsa/server-utils';
import { IAuthRole, SupabaseAuthService } from '@picsa/shared/services/core/supabase/services/supabase-auth.service';

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
  public readonly authRoles = computed<IAuthRole[]>(() => {
    const deploymentId = this.activeDeploymentId();
    const rolesByDeploymentId = this.rolesByDeploymentId();
    if (deploymentId && rolesByDeploymentId) {
      const authRoles: IAuthRole[] = rolesByDeploymentId[deploymentId] || [];
      return assignImplicitRoles(authRoles);
    }
    return [];
  });

  public refreshAuthRoles(deploymentId: string) {
    if (deploymentId !== this.activeDeploymentId()) {
      this.activeDeploymentId.set(deploymentId);
    }
  }
}
