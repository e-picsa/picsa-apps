import { CommonModule } from '@angular/common';
import { Component, effect, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { StoragePathPipe } from '@picsa/shared/services/core/supabase';

import { DeploymentDashboardService } from '../../deployment.service';
import { IDeploymentRow } from '../../types';

const DISPLAYED_COLUMNS: (keyof IDeploymentRow)[] = ['country_code', 'label', 'public', 'access_key_md5', 'icon_path'];

@Component({
  selector: 'dashboard-deployment-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTabsModule, PicsaDataTableComponent, StoragePathPipe],
  templateUrl: './deployment-list.component.html',
  styleUrls: ['./deployment-list.component.scss'],
})
export class DeploymentListComponent implements OnInit {
  public farmer: IDeploymentRow[] = [];
  public extension: IDeploymentRow[] = [];
  public other: IDeploymentRow[] = [];

  public tableOptions: IDataTableOptions = {
    search: false,
    displayColumns: DISPLAYED_COLUMNS,
    formatHeader: (value) => {
      if (value === 'access_key_md5') return 'Restricted';
      if (value === 'icon_path') return 'Icon';
      return formatHeaderDefault(value);
    },
  };

  constructor(public service: DeploymentDashboardService) {
    effect(() => {
      const allDeployments = this.service.deployments();
      this.farmer = allDeployments.filter((d) => d.variant === 'farmer');
      this.extension = allDeployments.filter((d) => d.variant === 'extension');
      this.other = allDeployments.filter((d) => d.variant === 'other');
    });
  }

  async ngOnInit() {
    await this.service.ready();
  }
}
