import { CommonModule } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { DASHBOARD_NAV_LINKS, INavLink } from './data';
import { DashboardMaterialModule } from './material.module';
import { DeploymentSelectComponent } from './modules/deployment/components';

@Component({
  standalone: true,
  imports: [RouterModule, DashboardMaterialModule, DeploymentSelectComponent, CommonModule],
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
      // matIcon: 'apps',
    },
    // {
    //   label: 'Users',
    //   href: '/users',
    // },
  ];

  constructor(public supabaseService: SupabaseService) {}

  async ngAfterViewInit() {
    await this.supabaseService.ready();
    await this.supabaseService.auth.signInDefaultUser();
  }
}
