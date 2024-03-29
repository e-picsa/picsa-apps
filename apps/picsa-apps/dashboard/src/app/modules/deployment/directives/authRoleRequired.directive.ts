import { Directive, signal, TemplateRef, ViewContainerRef } from '@angular/core';

import { DeploymentDashboardService } from '../deployment.service';

/**
 * Structural directive used to show/hide UI content based on required deployment auth roles
 * https://angular.io/guide/structural-directives#creating-a-structural-directive
 */
// eslint-disable-next-line @angular-eslint/directive-selector
@Directive({ selector: '[roleRequired]', standalone: true })
export class AuthRoleRequiredDirective {
  private templateRef: TemplateRef<any>;
  private viewContainer: ViewContainerRef;
  private hasView = false;

  // private roleRequired = input.

  private roleRequired$ = signal<string | null>(null);

  constructor(private service: DeploymentDashboardService) {}

  // @Input() set roleRequired(featureRole: string) {
  //   const [feature, role] = featureRole.split(':');
  //   if (feature && role && this.service.authRoles)
  //     if (!condition && !this.hasView) {
  //       this.viewContainer.createEmbeddedView(this.templateRef);
  //       this.hasView = true;
  //     } else if (condition && this.hasView) {
  //       this.viewContainer.clear();
  //       this.hasView = false;
  //     }
  // }

  // TODO - use enum to check if user has required role or higher
}
