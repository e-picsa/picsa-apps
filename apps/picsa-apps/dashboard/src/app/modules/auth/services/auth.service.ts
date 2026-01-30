import { computed, inject, Injectable, signal } from '@angular/core';
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
      return this.assignImplicitRoles(authRoles);
    }
    return [];
  });

  public refreshAuthRoles(deploymentId: string) {
    if (deploymentId !== this.activeDeploymentId()) {
      this.activeDeploymentId.set(deploymentId);
    }
  }

  private assignImplicitRoles(authRoles: IAuthRole[]) {
    // assign default roles to all deployments
    let globalRole: IAuthRole = 'viewer';
    if (authRoles.includes('author')) globalRole = 'author';
    if (authRoles.includes('admin')) globalRole = 'admin';

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
    const uniqueRoles = new Set([globalRole, ...authRoles, ...implicitRoles]);
    return [...uniqueRoles] as IAuthRole[];
  }
}
