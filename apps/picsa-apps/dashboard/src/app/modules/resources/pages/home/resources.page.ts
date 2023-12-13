import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { DashboardMaterialModule } from '../../../../material.module';
import { DashboardResourcesStorageLinkComponent } from '../../components';
import { ResourcesDashboardService } from '../../resources.service';

@Component({
  selector: 'dashboard-resources-page',
  standalone: true,
  imports: [CommonModule, DashboardResourcesStorageLinkComponent, DashboardMaterialModule, RouterModule],
  templateUrl: './resources.page.html',
  styleUrls: ['./resources.page.scss'],
})
export class ResourcesPageComponent implements OnInit {
  public displayedColumns = ['title', 'storage_file'];
  constructor(public service: ResourcesDashboardService) {}
  ngOnInit(): void {
    this.service.ready();
  }
}
