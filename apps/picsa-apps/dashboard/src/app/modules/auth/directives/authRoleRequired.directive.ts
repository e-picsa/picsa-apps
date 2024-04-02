import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { IAuthRole } from '@picsa/shared/services/core/supabase/services/supabase-auth.service';

import { DashboardAuthService } from '../services/auth.service';

/**
 * Structural directive used to show/hide UI content based on required deployment auth roles
 * https://angular.io/guide/structural-directives#creating-a-structural-directive
 *
 * @example
 * ```html
 * <div *roleRequired="'resources.viewer'">
 * ```
 */
// eslint-disable-next-line @angular-eslint/directive-selector
@Directive({ selector: '[roleRequired]', standalone: true })
export class AuthRoleRequiredDirective {
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);

  /** Track if template currently has view populated */
  private hasView = false;

  /** Input signal to track role required for view */
  public roleRequired = input<IAuthRole>();

  constructor(service: DashboardAuthService) {
    // recalcuate user view permissions whenever requiredRole or deploymentRoles change
    effect(() => {
      const requiredRole = this.roleRequired();
      const deploymentRoles = service.authRoles();
      const canView = this.doesUserHaveRole(requiredRole, deploymentRoles);
      this.setViewContent(canView);
    });
  }

  private doesUserHaveRole(requiredRole?: IAuthRole, deploymentRoles?: IAuthRole[]) {
    if (!requiredRole) return true;
    if (!deploymentRoles) return false;
    return deploymentRoles.includes(requiredRole);
  }

  /** Dynamically populate or remove associated view content depending on view permissions */
  private setViewContent(canView: boolean) {
    if (canView && !this.hasView) {
      if (this.viewContainer && this.templateRef) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      }
    } else if (!canView && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
