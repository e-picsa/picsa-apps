import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { Database } from '@picsa/server-types';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features/data-table';
import { NgxJsonViewerModule } from 'ngx-json-viewer';

import { DashboardMaterialModule } from '../../../../material.module';
import { IMonitoringFormsRow, MonitoringFormsDashboardService } from '../../monitoring.service';

export type IMonitoringSubmissionsRow = Database['public']['Tables']['monitoring_tool_submissions']['Row'];

@Component({
  selector: 'dashboard-form-submissions',
  imports: [
    CommonModule,
    DashboardMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    NgxJsonViewerModule,
    PicsaDataTableComponent,
  ],
  templateUrl: './form-submissions.component.html',
  styleUrls: ['./form-submissions.component.scss'],
})
export class FormSubmissionsComponent {
  public form: IMonitoringFormsRow | null = null;
  public submissions: any[];
  dataLoadError: string;
  displayedColumns: string[];

  constructor(private service: MonitoringFormsDashboardService, private route: ActivatedRoute, private router: Router) {
    this.service.ready();
    this.route.params.subscribe(async (params) => {
      const id = params['id'];
      const form = await service.getFormById(id);
      this.form = form;
      if (form && form.summary_fields) {
        this.displayedColumns = form.summary_fields.map((entry) => entry?.['field']);
      }
      await this.fetchSubmissions(id);
    });
  }
  public tableOptions: IDataTableOptions = {
    paginatorSizes: [25, 50],
  };

  async fetchSubmissions(formId: string) {
    const { data, error } = await this.service.getSubmissions(formId);
    if (error) {
      this.dataLoadError = 'Failed to fetch submitions';
    } else {
      this.submissions = data.map((submission) => {
        if (submission.json) {
          return submission.json;
        }
        return;
      });
    }
  }
}
