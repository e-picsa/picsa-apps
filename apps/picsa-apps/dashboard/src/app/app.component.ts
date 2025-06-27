import { NgTemplateOutlet } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { APP_VERSION } from '@picsa/environments/src';
import { PicsaDialogService } from '@picsa/shared/features';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { ADMIN_NAV_LINKS, DASHBOARD_NAV_LINKS } from './data';
import { DashboardMaterialModule } from './material.module';
import { AuthRoleRequiredDirective } from './modules/auth';
import { DeploymentSelectComponent } from './modules/deployment/components';
import { DeploymentDashboardService } from './modules/deployment/deployment.service';
import { ProfileMenuComponent } from './modules/profile/components/profile-menu/profile-menu.component';

@Component({
  imports: [
    NgTemplateOutlet,
    RouterModule,
    DashboardMaterialModule,
    DeploymentSelectComponent,
    ProfileMenuComponent,
    AuthRoleRequiredDirective,
  ],
  selector: 'dashboard-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit {
  title = 'picsa-apps-dashboard';
  navLinks = DASHBOARD_NAV_LINKS;
  adminLinks = ADMIN_NAV_LINKS;
  appVersion = APP_VERSION;

  public deployment = this.deploymentService.activeDeployment;

  public initComplete = signal(false);

  constructor(
    public supabaseService: SupabaseService,
    private deploymentService: DeploymentDashboardService,
    dialogService: PicsaDialogService,
  ) {
    // HACK - disable translation in dialog to prevent loading extension app config service theme
    dialogService.useTranslation = false;
  }

  async ngAfterViewInit() {
    // eagerly initialise supabase and deployment services to ensure available
    // NOTE - do not include any services here that depend on an active deployment (could be undefined)
    await this.supabaseService.ready();
    await this.deploymentService.ready();
    this.initComplete.set(true);
  }
}
