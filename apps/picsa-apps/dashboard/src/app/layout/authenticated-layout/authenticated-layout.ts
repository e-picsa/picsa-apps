import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { APP_VERSION } from '@picsa/environments/src/version';

import { ADMIN_NAV_LINKS, DASHBOARD_NAV_LINKS } from '../../data';
import { DashboardMaterialModule } from '../../material.module';
import { AuthRoleRequiredDirective } from '../../modules/auth';
import { DeploymentSelectComponent } from '../../modules/deployment/components';
import { ProfileMenuComponent } from '../../modules/profile/components/profile-menu/profile-menu.component';
import { DashboardFooterComponent } from '../footer/footer.component';

export const SIDEBAR_COLLAPSED_KEY = 'picsa_dashboard_sidebar_collapsed';

const getInitialCollapsedState = (): boolean => {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
};

@Component({
  imports: [
    NgTemplateOutlet,
    RouterModule,
    DashboardFooterComponent,
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

  isCollapsed = signal<boolean>(getInitialCollapsedState());
  isHovered = signal<boolean>(false);

  isEffectiveExpanded = computed(() => !this.isCollapsed() || this.isHovered());

  toggleSidebar() {
    this.isCollapsed.update((collapsed) => {
      const next = !collapsed;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
    this.isHovered.set(false);
  }

  onMouseEnter() {
    if (this.isCollapsed()) {
      this.isHovered.set(true);
    }
  }

  onMouseLeave() {
    if (this.isCollapsed()) {
      this.isHovered.set(false);
    }
  }
}
