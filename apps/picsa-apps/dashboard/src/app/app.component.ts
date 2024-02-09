import { CommonModule } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { DashboardMaterialModule } from './material.module';

interface INavLink {
  label: string;
  href: string;
  children?: INavLink[];
}

@Component({
  standalone: true,
  imports: [RouterModule, DashboardMaterialModule, CommonModule],
  selector: 'dashboard-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  title = 'picsa-apps-dashboard';

  navLinks: INavLink[] = [
    {
      label: 'Resources',
      href: '/resources',
    },
    {
      label: 'Climate',
      href: '/climate',
      children: [
        {
          label: 'Station Data',
          href: '/station',
        },
        {
          label: 'Forecasts',
          href: '/forecast',
        },
      ],
    },
    // {
    //   label: 'Crop Information',
    //   href: '/crop-information',
    // },
    // {
    //   label: 'Monitoring Forms',
    //   href: '/monitoring-forms',
    // },
    {
      label: 'Translations',
      href: '/translations',
    },
  ];

  globalLinks: INavLink[] = [
    // {
    //   label: 'Deployments',
    //   href: '/deployments',
    // },
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
