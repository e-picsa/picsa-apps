import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Router } from '@angular/router';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Database } from '@picsa/server-types';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features/data-table';

import { DashboardMaterialModule } from '../../../../material.module';
import { MonitoringFormsDashboardService } from '../../monitoring.service';
export type IMonitoringFormsRow = Database['public']['Tables']['monitoring_forms']['Row'];

@Component({
  selector: 'dashboard-monitoring-page',
  standalone: true,
  imports: [CommonModule, DashboardMaterialModule, RouterModule, PicsaDataTableComponent],
  templateUrl: './monitoring.page.html',
  styleUrls: ['./monitoring.page.scss'],
})
export class MonitoringPageComponent implements OnInit {
  displayedColumns: (keyof IMonitoringFormsRow)[] = [
    'title',
    'description',
    'summary_fields',
    'enketo_form',
    'enketo_model',
    'created_at'
  ];

  constructor(public service: MonitoringFormsDashboardService, private router: Router, private route: ActivatedRoute) {}

  public tableOptions: IDataTableOptions = {
    paginatorSizes: [25, 50],
  };
  ngOnInit(): void {
    this.service.ready();
  }
  //this was returning undefined for "this.router" before I made it an arrow funtion, any idea why?
  onRowClick = (row: IMonitoringFormsRow) => {
    this.router.navigate([row.id], { relativeTo: this.route });
  };
}
