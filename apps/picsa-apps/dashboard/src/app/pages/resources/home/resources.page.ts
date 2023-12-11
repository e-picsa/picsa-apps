import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { DashboardMaterialModule } from '../../../material.module';
import { ResourcesDashboardService } from '../resources.service';

@Component({
  selector: 'dashboard-resources-page',
  standalone: true,
  imports: [CommonModule, DashboardMaterialModule, RouterModule],
  templateUrl: './resources.page.html',
  styleUrls: ['./resources.page.scss'],
})
export class ResourcesPageComponent {
  public displayedColumns = ['description', 'storage_file'];
  constructor(public service: ResourcesDashboardService) {}
}
