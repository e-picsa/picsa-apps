import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { DashboardMaterialModule } from '../../../../material.module';
// import { DashboardResourcesStorageLinkComponent } from '../../components';
import { ResourcesDashboardService } from '../../translations.service';

@Component({
  selector: 'dashboard-resources-page',
  standalone: true,
  imports: [CommonModule, DashboardMaterialModule, RouterModule],
  templateUrl: './translations.page.html',
  styleUrls: ['./translations.page.scss'],
})
export class TranslationsPageComponent implements OnInit {
  //public displayedColumns = ['title', 'storage_file'];
  constructor(public service: ResourcesDashboardService) {}
  ngOnInit(): void {
    this.service.ready();
  }
}
