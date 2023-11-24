import { CommonModule } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { DashboardMaterialModule } from './material.module';

interface INavLink {
  label: string;
  href: string;
  isActive?: boolean;
}

@Component({
  standalone: true,
  imports: [RouterModule, DashboardMaterialModule, CommonModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  title = 'picsa-apps-dashboard';

  navLinks: INavLink[] = [
    {
      label: 'Home',
      href: '/',
    },
    {
      label: 'Resources',
      href: '/resources',
    },
  ];

  constructor(public supabaseService: SupabaseService, private notificationService: PicsaNotificationService) {}

  async ngAfterViewInit() {
    await this.supabaseService.init();
    await this.supabaseService.signInDefaultUser();
  }
}
