import { AfterViewInit, ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { PicsaDialogService } from '@picsa/shared/features';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { filter, map } from 'rxjs/operators';

import { PUBLIC_PAGES } from './data';
import { AuthenticatedLayoutComponent } from './layout/authenticated-layout/authenticated-layout';
import { DeploymentSelectLayoutComponent } from './layout/deployment-select/deployment-select.component';
import { DashboardFooterComponent } from './layout/footer/footer.component';
import { LandingPageComponent } from './layout/landing/landing.component';
import { DashboardMaterialModule } from './material.module';
import { DashboardAuthService } from './modules/auth/services/auth.service';
import { DeploymentDashboardService } from './modules/deployment/deployment.service';

type ViewState = 'public' | 'authenticated' | 'landing' | 'loading' | 'deployment-select';

@Component({
  imports: [
    RouterModule,
    MatProgressSpinnerModule,
    DashboardMaterialModule,
    DeploymentSelectLayoutComponent,
    DashboardFooterComponent,
    LandingPageComponent,
    AuthenticatedLayoutComponent,
  ],
  selector: 'dashboard-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit {
  private supabaseService = inject(SupabaseService);
  private deploymentService = inject(DeploymentDashboardService);
  private authService = inject(DashboardAuthService);
  private router = inject(Router);

  /** Track public pages for unauthenticated user access */
  private isPublicPage = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => {
        return PUBLIC_PAGES.includes(e.urlAfterRedirects.replace('/', ''));
      }),
    ),
    { initialValue: false },
  );

  public viewState = computed<ViewState>(() => {
    // Show public pages immediately
    if (this.isPublicPage()) return 'public';
    // Landing page bypass (skip loading if no data stored at all)
    if (!this.authService.authUser() && localStorage.length === 0) {
      return 'landing';
    }

    if (this.authService.authUser()) {
      if (!this.deploymentService.isDeploymentChecked()) return 'loading';
      if (!this.deploymentService.activeDeployment()) return 'deployment-select';
      return 'authenticated';
    } else {
      if (!this.authService.isAuthChecked()) return 'loading';
      return 'landing';
    }
  });
  public shouldShowFooter = computed(() => !['authenticated', 'loading'].includes(this.viewState()));

  constructor() {
    const dialogService = inject(PicsaDialogService);
    // HACK - disable translation in dialog to prevent loading extension app config service theme
    dialogService.useTranslation = false;
  }

  async ngAfterViewInit() {
    // eagerly initialise supabase and deployment services to ensure available
    // NOTE - do not include any services here that depend on an active deployment (could be undefined)
    await this.supabaseService.ready();
  }
}
