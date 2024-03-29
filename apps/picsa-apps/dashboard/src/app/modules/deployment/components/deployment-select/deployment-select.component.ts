import { CommonModule } from '@angular/common';
import { Component, computed, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { StoragePathPipe } from '@picsa/shared/services/core/supabase';
import { IAuthUser, SupabaseAuthService } from '@picsa/shared/services/core/supabase/services/supabase-auth.service';

import { DeploymentDashboardService } from '../../deployment.service';
import { IDeploymentRow } from '../../types';

@Component({
  selector: 'dashboard-deployment-select',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule, StoragePathPipe],
  templateUrl: './deployment-select.component.html',
  styleUrls: ['./deployment-select.component.scss'],
})
export class DeploymentSelectComponent implements OnInit {
  /** Computed list of deployments where user has auth roles */
  public userDeployments = computed<IDeploymentRow[]>(() => {
    const user = this.authService.authUser();
    const deployments = this.service.deployments();
    if (user) {
      return this.getUserDeployments(user, deployments);
    }
    return [];
  });
  constructor(public service: DeploymentDashboardService, private authService: SupabaseAuthService) {}

  async ngOnInit() {
    await this.service.ready();
    this.authService.authUser();
  }

  /** Filter list of all deployments to only include those which are public or where user has auth roles */
  private getUserDeployments(user: IAuthUser, deployments: IDeploymentRow[]) {
    const { picsa_roles } = user;
    const filtered = deployments.filter((d) => d.public || d.id in picsa_roles);
    return filtered.sort(this.sortDeployments);
  }

  // Sort deployments so global (no country code) appear on bottom of list, and otherwise
  // group by variant
  private sortDeployments(a: IDeploymentRow, b: IDeploymentRow) {
    if (a.country_code === b.country_code) return a.variant! > b.variant! ? 1 : -1;
    if (!a.country_code) return 1;
    return -1;
  }
}
