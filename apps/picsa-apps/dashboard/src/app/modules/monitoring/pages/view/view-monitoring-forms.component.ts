import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { Database } from '@picsa/server-types';
import { WebcomponentsNgxModule } from '@picsa/webcomponents-ngx';
import { NgxJsonViewerModule } from 'ngx-json-viewer';

import { DashboardMaterialModule } from '../../../../material.module';
import { MonitoringFormsDashboardService } from '../../monitoring.service';

export type IMonitoringFormsRow = Database['public']['Tables']['monitoring_forms']['Row'];

@Component({
  selector: 'dashboard-monitoring-view',
  standalone: true,
  imports: [
    CommonModule,
    DashboardMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgxJsonViewerModule,
    WebcomponentsNgxModule,
  ],
  templateUrl: './view-monitoring-forms.component.html',
  styleUrls: ['./view-monitoring-forms.component.scss'],
})
export class ViewMonitoringFormsComponent implements OnInit {
  public form: IMonitoringFormsRow;
  dataLoadError: string;
  constructor(private service: MonitoringFormsDashboardService, private route: ActivatedRoute) {}
  async ngOnInit() {
    await this.service.ready();
    this.route.params.subscribe(async (params) => {
      const id = params['id'];
      this.service
        .getFormById(id)
        .then((data) => {
          this.form = data;
        })
        .catch((error) => {
          console.error('Error fetching Form:', error);
          this.dataLoadError = 'Failed to fetch Form.';
        });
    });
  }
}
