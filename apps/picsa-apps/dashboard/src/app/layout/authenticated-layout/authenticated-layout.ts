import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { APP_VERSION } from '@picsa/environments/src/version';

import { ADMIN_NAV_LINKS, DASHBOARD_NAV_LINKS } from '../../data';
import { DashboardMaterialModule } from '../../material.module';
import { AuthRoleRequiredDirective } from '../../modules/auth';
import { DeploymentSelectComponent } from '../../modules/deployment/components';
import { ProfileMenuComponent } from '../../modules/profile/components/profile-menu/profile-menu.component';

@Component({
  imports: [
    NgTemplateOutlet,
    RouterModule,
    MatProgressSpinnerModule,
    DashboardMaterialModule,
    DeploymentSelectComponent,
    ProfileMenuComponent,
    AuthRoleRequiredDirective,
  ],
  selector: 'dashboard-authenticated-layout',
  templateUrl: './authenticated-layout.html',
  styleUrls: ['./authenticated-layout.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthenticatedLayoutComponent {
  navLinks = DASHBOARD_NAV_LINKS;
  adminLinks = ADMIN_NAV_LINKS;
  appVersion = APP_VERSION;
}
