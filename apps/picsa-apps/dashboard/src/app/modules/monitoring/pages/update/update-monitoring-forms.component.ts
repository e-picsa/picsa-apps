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
import { SupabaseStorageService } from '@picsa/shared/services/core/supabase/services/supabase-storage.service';
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
  public storageBucketName = 'global';
  public storageFolderPath = 'monitoring/forms';
  constructor(
    private service: MonitoringFormsDashboardService,
    private route: ActivatedRoute,
    private storageService: SupabaseStorageService
  ) {}
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

  public async handleUploadComplete(res: IUploadResult[]) {
    if (res.length === 0) {
      return;
    }
    // As conversion is a 2-step process (xls file -> xml form -> enketo form) track progress
    // so that uploaded file can be removed if not successful
    let xformConversionSuccess = false;
    this.uploading = true;
    const [{ data, entry }] = res;

    const xform = await this.service.submitFormToConvertXlsToXForm(data as File);

    if (xform) {
      const blob = new Blob([xform], { type: 'text/xml' });
      const xmlFile = new File([blob], 'form.xml', { type: 'text/xml' });
      const formData = new FormData();
      formData.append('files', xmlFile);

      const enketoContent = await this.service.submitFormToConvertXFormToEnketo(formData);
      if (enketoContent) {
        const { form, languageMap, model, theme } = enketoContent;
        // Update db entry with form_xlsx
        this.form = await this.service.updateFormById(this.form.id, {
          form_xlsx: `${this.storageBucketName}/${this.storageFolderPath}/${entry.name}`,
          enketo_form: form,
          enketo_model: model,
          enketo_definition: { ...(this.form.enketo_definition as any), languageMap, theme },
        });
        this.updateFeedbackMessage = 'Form updated successfully!';
        this.uploading = false;
        xformConversionSuccess = true;
      }
    }
    // If conversion not successful delete file from storage
    if (!xformConversionSuccess) {
      const storagePath = `${this.storageFolderPath}/${entry.name}`;
      const { error } = await this.storageService.deleteFile(this.storageBucketName, storagePath);
      if (error) throw error;
    }
  }
}
