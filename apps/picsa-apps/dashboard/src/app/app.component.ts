import { CommonModule } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { DashboardMaterialModule } from './material.module';
import { CropInformationModule } from './modules/crop-information/crop-information.module';

interface INavLink {
  label: string;
  href: string;
  isActive?: boolean;
}

@Component({
  standalone: true,
  imports: [RouterModule, DashboardMaterialModule, CommonModule, CropInformationModule],
  selector: 'dashboard-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  title = 'picsa-apps-dashboard';

  navLinks: INavLink[] = [
    // {
    //   label: 'Home',
    //   href: '',
    // },
    {
      label: 'Resources',
      href: '/resources',
    },
    {
      label: 'Climate Data',
      href: '/climate-data',
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
    {
      label: 'Crop Information',
      href: '/crop',
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
