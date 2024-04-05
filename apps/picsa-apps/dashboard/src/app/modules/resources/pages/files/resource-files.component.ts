import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { DashboardMaterialModule } from '../../../../material.module';
import { DashboardResourcesStorageLinkComponent } from '../../components/storage-link/storage-link.component';
import { ResourcesDashboardService } from '../../resources.service';

@Component({
  selector: 'dashboard-resource-files',
  standalone: true,
  imports: [CommonModule, CommonModule, DashboardMaterialModule, DashboardResourcesStorageLinkComponent, RouterModule],
  templateUrl: './resource-files.component.html',
  styleUrl: './resource-files.component.scss',
})
export class ResourceFilesComponent implements OnInit {
  public displayedColumns = ['title', 'storage_file'];
  constructor(public service: ResourcesDashboardService) {}
  async ngOnInit() {
    await this.service.ready();
  }
}
