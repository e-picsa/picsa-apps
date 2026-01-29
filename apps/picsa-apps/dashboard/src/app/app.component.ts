import { NgTemplateOutlet } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { APP_VERSION } from '@picsa/environments/src/version';
import { PicsaDialogService } from '@picsa/shared/features';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { filter, map } from 'rxjs/operators';

import { ADMIN_NAV_LINKS, DASHBOARD_NAV_LINKS, PUBLIC_PAGES } from './data';
import { DashboardMaterialModule } from './material.module';
import { AuthRoleRequiredDirective } from './modules/auth';
import { DashboardAuthService } from './modules/auth/services/auth.service';
import { DeploymentSelectComponent } from './modules/deployment/components';
import { DeploymentDashboardService } from './modules/deployment/deployment.service';
import { LandingPageComponent } from './modules/landing/landing.component';
import { ProfileMenuComponent } from './modules/profile/components/profile-menu/profile-menu.component';

@Component({
  imports: [
    NgTemplateOutlet,
    RouterModule,
    MatProgressSpinnerModule,
    DashboardMaterialModule,
    DeploymentSelectComponent,
    ProfileMenuComponent,
    AuthRoleRequiredDirective,
    LandingPageComponent,
  ],
  selector: 'dashboard-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit {
  supabaseService = inject(SupabaseService);
  private deploymentService = inject(DeploymentDashboardService);
  public authService = inject(DashboardAuthService);
  private router = inject(Router);

  title = 'picsa-apps-dashboard';
  navLinks = DASHBOARD_NAV_LINKS;
  adminLinks = ADMIN_NAV_LINKS;
  appVersion = APP_VERSION;

  /** Track public pages for unauthenticated user access */
  public isPublicPage = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => {
        return PUBLIC_PAGES.includes(e.urlAfterRedirects.replace('/', ''));
      }),
    ),
    { initialValue: false },
  );

  public deployment = this.deploymentService.activeDeployment;

  public initComplete = signal(false);

  constructor() {
    const dialogService = inject(PicsaDialogService);

    // HACK - disable translation in dialog to prevent loading extension app config service theme
    dialogService.useTranslation = false;
  }

  async ngAfterViewInit() {
    // eagerly initialise supabase and deployment services to ensure available
    // NOTE - do not include any services here that depend on an active deployment (could be undefined)
    await this.supabaseService.ready();
    // Also wait for auth service to be ready (which waits for supabase client)
    // Though initComplete is purely a local signal. Auth service has its own wait.
    // Wait, the plan says "Update initialization logic to wait for auth check".
    // `authService.init()` awaits `supabaseAuthService.ready()` which waits for `register$`.
    // It does NOT wait for `isAuthChecked` to be true. `isAuthChecked` becomes true asynchronously on auth state change.
    // So we just need to ensure services are ready. The template handles `isAuthChecked`.
    await this.authService.ready();
    this.initComplete.set(true);
  }
}
