import { CommonModule } from '@angular/common';
import { Component, effect, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { StoragePathPipe } from '@picsa/shared/services/core/supabase';

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
  public deployments: IDeploymentRow[] = [];
  constructor(public service: DeploymentDashboardService) {
    effect(() => {
      const allDeployments = service.deployments();
      this.deployments = allDeployments.sort(this.sortDeployments);
    });
  }

  async ngOnInit() {
    await this.service.ready();
  }

  // Sort deployments so global (no country code) appear on bottom of list, and otherwise
  // group by variant
  private sortDeployments(a: IDeploymentRow, b: IDeploymentRow) {
    if (a.country_code === b.country_code) return a.variant! > b.variant! ? 1 : -1;
    if (!a.country_code) return 1;
    return -1;
  }
}
