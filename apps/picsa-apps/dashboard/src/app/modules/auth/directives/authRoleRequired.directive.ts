import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AppRole } from '@picsa/server-types';

import { DashboardAuthService } from '../services/auth.service';

/**
 * Structural directive used to show/hide UI content based on required deployment auth roles
 * https://angular.io/guide/structural-directives#creating-a-structural-directive
 *
 * @example
 * ```html
 * <div *roleRequired="'resources.editor'">
 * ```
 */
// eslint-disable-next-line @angular-eslint/directive-selector
@Directive({ selector: '[roleRequired]' })
export class AuthRoleRequiredDirective {
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);

  /** Track if template currently has view populated */
  private hasView = false;

  /** Input signal to track role required for view */
  public roleRequired = input<AppRole>();

  constructor() {
    const service = inject(DashboardAuthService);

    // recalcuate user view permissions whenever requiredRole or deploymentRoles change
    effect(() => {
      const requiredRole = this.roleRequired();
      const canView = service.hasRole(requiredRole);
      this.setViewContent(canView);
    });
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
