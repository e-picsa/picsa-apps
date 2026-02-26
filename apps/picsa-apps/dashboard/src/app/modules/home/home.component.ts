import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal, Type as ComponentType } from '@angular/core';
import { RouterModule } from '@angular/router';
import type { AppRole } from '@picsa/server-types';

import { DASHBOARD_NAV_LINKS } from '../../data';
import { DashboardMaterialModule } from '../../material.module';
import { DashboardAuthService } from '../auth/services/auth.service';
import { HOME_ADMIN_COMPONENTS, HomeOverviewComponent } from './components/overviewComponents';

interface ResolvedComponent extends HomeOverviewComponent {
  loadedComponent?: ComponentType<unknown>;
  error?: unknown;
}

@Component({
  selector: 'dashboard-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [DashboardMaterialModule, RouterModule, NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHomeComponent {
  public resolvedComponents = signal<ResolvedComponent[]>([]);
  public navLinks = DASHBOARD_NAV_LINKS.filter(({ href, roleRequired }) => !roleRequired && href !== '/home');

  private authService = inject(DashboardAuthService);

  constructor() {
    effect(() => {
      const roles = this.authService.authRoles();
      this.resolveComponents(roles);
    });
  }

  private async resolveComponents(roles: AppRole[]) {
    const components = HOME_ADMIN_COMPONENTS.filter(
      ({ roleRequired }) => !roleRequired || roles.includes(roleRequired),
    );
    const renderOps = components.map(async (component): Promise<ResolvedComponent> => {
      try {
        const loadedComponent = await component.load();
        return { ...component, loadedComponent };
      } catch (error) {
        console.error(`Failed to load summary component for ${component.label}`, error);
        return { ...component, error };
      }
    });

    const resolved = await Promise.all(renderOps);
    this.resolvedComponents.set(resolved);
  }
}
