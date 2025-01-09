import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
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
  imports: [DashboardMaterialModule, DatePipe, RouterModule, PicsaDataTableComponent],
  templateUrl: './monitoring.page.html',
  styleUrls: ['./monitoring.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitoringPageComponent implements OnInit {
  displayedColumns: (keyof IMonitoringFormsRow)[] = [
    'title',
    'description',
    'summary_fields',
    'enketo_form',
    'enketo_model',
    'created_at',
  ];

  constructor(public service: MonitoringFormsDashboardService, private router: Router, private route: ActivatedRoute) {}

  public tableOptions: IDataTableOptions = {
    paginatorSizes: [25, 50],
  };
  async ngOnInit() {
    await this.service.ready();
    await this.service.listMonitoringForms();
  }
  //this was returning undefined for "this.router" before I made it an arrow funtion, any idea why?
  onRowClick = (row: IMonitoringFormsRow) => {
    this.router.navigate([row.id], { relativeTo: this.route });
  };
}
