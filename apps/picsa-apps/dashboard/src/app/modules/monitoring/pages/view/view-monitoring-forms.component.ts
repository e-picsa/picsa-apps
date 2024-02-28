import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { Database } from '@picsa/server-types';
import { NgxJsonViewerModule } from 'ngx-json-viewer';

import { DashboardMaterialModule } from '../../../../material.module';
import { MonitoringFormsDashboardService } from '../../monitoring.service';

export type IMonitoringFormsRow = Database['public']['Tables']['monitoring_forms']['Row'];

@Component({
  selector: 'dashboard-monitoring-view',
  standalone: true,
  imports: [CommonModule, DashboardMaterialModule, FormsModule, ReactiveFormsModule, NgxJsonViewerModule],
  templateUrl: './view-monitoring-forms.component.html',
  styleUrls: ['./view-monitoring-forms.component.scss'],
})
export class ViewMonitoringFormsComponent {
  public form: IMonitoringFormsRow;
  dataLoadError: string;
  constructor(private service: MonitoringFormsDashboardService, private route: ActivatedRoute, private router: Router) {
    this.service.ready();
    this.route.params.subscribe((params) => {
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
  openSubmissions = async (formId:string) => {
    this.router.navigate([`/monitoring-forms/${this.form.id}/submissions`, formId]);
  };
}
