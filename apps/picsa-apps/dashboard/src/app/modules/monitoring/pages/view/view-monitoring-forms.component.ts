import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import type { Database } from '@picsa/server-types';
import { PicsaDialogService } from '@picsa/shared/features';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { WebcomponentsNgxModule } from '@picsa/webcomponents-ngx';
import { NgxJsonViewerModule } from 'ngx-json-viewer';

import { DashboardMaterialModule } from '../../../../material.module';
import { MonitoringFormsDashboardService } from '../../monitoring.service';

export type IMonitoringFormsRow = Database['public']['Tables']['monitoring_forms']['Row'];

@Component({
  selector: 'dashboard-monitoring-view',
  imports: [
    DashboardMaterialModule,
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgxJsonViewerModule,
    WebcomponentsNgxModule,
  ],
  templateUrl: './view-monitoring-forms.component.html',
  styleUrls: ['./view-monitoring-forms.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewMonitoringFormsComponent implements OnInit {
  public form: IMonitoringFormsRow;

  public enketoForm: string;
  public enketoModel: string;

  dataLoadError: string;

  constructor(
    private service: MonitoringFormsDashboardService,
    private route: ActivatedRoute,
    private dialogService: PicsaDialogService,
    private notificationService: PicsaNotificationService,
    private router: Router,
  ) {}
  async ngOnInit() {
    await this.service.ready();
    this.route.params.subscribe(async (params) => {
      const id = params['id'];
      this.service
        .getFormById(id)
        .then((data) => {
          // decode base64-encoded form data
          if (data.enketo_form) {
            this.enketoForm = atob(data.enketo_form);
          }
          if (data.enketo_model) {
            this.enketoModel = atob(data.enketo_model);
          }
          this.form = data;
        })
        .catch((error) => {
          console.error('Error fetching Form:', error);
          this.dataLoadError = 'Failed to fetch Form.';
        });
    });
  }

  public async promptDelete() {
    const dialog = await this.dialogService.open('delete');
    dialog.afterClosed().subscribe(async (shouldDelete) => {
      if (shouldDelete) {
        const { data, error } = await this.service.table.delete().eq('id', this.form.id);
        if (error) throw error;
        this.notificationService.showSuccessNotification('Form deleted');
        this.router.navigate(['..'], { relativeTo: this.route });
        await this.service.listMonitoringForms();
        // TODO - consider archiving instead of deleting
        // TODO - delete storage object
        // TODO - delete responses
        //
      }
    });
  }
}
