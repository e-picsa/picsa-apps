import { CommonModule } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { DASHBOARD_NAV_LINKS, INavLink } from './data';
import { DashboardMaterialModule } from './material.module';
import { DeploymentSelectComponent } from './modules/deployment/components';
import { ProfileMenuComponent } from './modules/profile/components/profile-menu/profile-menu.component';

@Component({
  standalone: true,
  imports: [RouterModule, DashboardMaterialModule, DeploymentSelectComponent, CommonModule, ProfileMenuComponent],
  selector: 'dashboard-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  title = 'picsa-apps-dashboard';
  navLinks = DASHBOARD_NAV_LINKS;

  globalLinks: INavLink[] = [
    {
      label: 'Deployments',
      href: '/deployment',
      matIcon: 'apps',
    },
    // {
    //   label: 'Users',
    //   href: '/users',
    // },
  ];

  constructor(public supabaseService: SupabaseService) {}

  async ngAfterViewInit() {
    // eagerly initialise supabase service to ensure available
    await this.supabaseService.ready();
  }
}
