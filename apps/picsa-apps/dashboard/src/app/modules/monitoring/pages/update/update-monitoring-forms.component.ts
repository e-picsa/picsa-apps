import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { Database } from '@picsa/server-types';
import {
  IUploadResult,
  SupabaseStoragePickerDirective,
  SupabaseUploadComponent,
} from '@picsa/shared/services/core/supabase';
import { NgxJsonViewerModule } from 'ngx-json-viewer';

import { DashboardMaterialModule } from '../../../../material.module';
import { MonitoringFormsDashboardService } from '../../monitoring.service';

export type IMonitoringFormsRow = Database['public']['Tables']['monitoring_forms']['Row'];

@Component({
  selector: 'dashboard-monitoring-update',
  standalone: true,
  imports: [
    CommonModule,
    DashboardMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgxJsonViewerModule,
    SupabaseUploadComponent,
    SupabaseStoragePickerDirective,
  ],
  templateUrl: './update-monitoring-forms.component.html',
  styleUrls: ['./update-monitoring-forms.component.scss'],
})
export class UpdateMonitoringFormsComponent implements OnInit {
  public form: IMonitoringFormsRow;
  public updateFeedbackMessage = '';
  public uploading = false;
  public allowedFileTypes = ['xlsx', 'xls'].map((ext) => `.${ext}`);
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
        });
    });
  }

  public async handleUploadComplete(res: IUploadResult[], controlName: 'submission_forms') {
    if (res.length === 0) {
      return;
    }
    this.uploading = true;
    const [{ entry }] = res;
    const [{ data }] = res;
    this.service.submitFormToConvertXlsToXForm(data).subscribe({
      next: (response) => {
        const xFormResponse = response['result'];
        const blob = new Blob([xFormResponse], { type: 'text/xml' });

        const xmlFile = new File([blob], 'form.xml', { type: 'text/xml' });

        const formData = new FormData();
        formData.append('files', xmlFile);
        this.service.submitFormToConvertXFormToEnketo(formData).subscribe({
          next: async (response) => {
            const convertedContent = response['convertedFiles'][0]['content'];
            //since path is not returned and it is what the relation requires
            //SUGGESTION: we could make this reference the entry's id instead
            if (entry) {
              this.form.form_xlsx = `resources/${controlName}/${entry.name}`;
            }
            if (this.form.enketo_definition) {
              this.form.enketo_definition['theme'] = convertedContent.theme;
              this.form.enketo_definition['languageMap'] = convertedContent.languageMap;
            }

            this.form.enketo_form = convertedContent.form;
            this.form.enketo_model = convertedContent.model;
            this.service
              .updateFormById(this.form.id, this.form)
              .then((data) => {
                this.form = data;
                this.updateFeedbackMessage = 'Form updated successfully!';
                this.uploading = false;
              })
              .catch((error) => {
                console.error('Failed to update form in database:', error);
                this.updateFeedbackMessage = 'Failed to update form. Please try again.';
                this.uploading = false;
              });
          },
          error: (error) => {
            console.error('Error occurred while converting to enketo:', error);
            this.updateFeedbackMessage = 'Failed to convert form to Enketo. Please try again.';
            this.uploading = false;
          },
        });
      },
      error: (error) => {
        console.error('Error occurred while converting to xform:', error);
        this.updateFeedbackMessage = 'Failed to convert form to XForm. Please try again.';
        this.uploading = false;
      },
    });
  }
}
