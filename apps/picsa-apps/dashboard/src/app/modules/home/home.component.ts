import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

import { DASHBOARD_NAV_LINKS } from '../../data';
import { AuthRoleRequiredDirective } from '../auth';

@Component({
  selector: 'dashboard-home',
  templateUrl: 'home.component.html',
  styleUrl: 'home.component.scss',
  standalone: true,
  imports: [MatCardModule, MatIconModule, RouterModule, AuthRoleRequiredDirective],
})
export class DashboardHomeComponent {
  public links = DASHBOARD_NAV_LINKS.filter((l) => l.href !== '/home');
}
