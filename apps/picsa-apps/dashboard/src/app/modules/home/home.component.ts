import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal, Type as ComponentType } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import type { AppRole } from '@picsa/server-types';

import { DashboardAuthService } from '../auth/services/auth.service';
import { HOME_OVERVIEW_COMPONENTS, HomeOverviewComponent } from './home-overview.components';

interface ResolvedComponent extends HomeOverviewComponent {
  loadedComponent?: ComponentType<unknown>;
  error?: unknown;
}

@Component({
  selector: 'dashboard-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [MatCardModule, MatIconModule, RouterModule, NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHomeComponent {
  public resolvedComponents = signal<ResolvedComponent[]>([]);

  private authService = inject(DashboardAuthService);

  constructor() {
    effect(() => {
      const roles = this.authService.authRoles();
      this.resolveComponents(roles);
    });
  }

  private async resolveComponents(roles: AppRole[]) {
    const components = HOME_OVERVIEW_COMPONENTS.filter(
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
