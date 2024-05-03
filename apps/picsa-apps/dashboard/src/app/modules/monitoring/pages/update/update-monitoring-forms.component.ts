import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Router } from '@angular/router';
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
  public convertXlsxFeedbackMessage = '';
  public uploading = false;
  public allowedFileTypes = ['xlsx', 'xls'].map((ext) => `.${ext}`);
  public allowedCoverTypes = ['jpg', 'jpeg', 'svg', 'png'].map((ext) => `.${ext}`);
  public storageBucketName = 'global';
  public storageFolderPath = 'monitoring/forms';
  public coverImageStorageFolder = 'monitoring/cover_images';
  public formID = null;
  public xformConversionSuccess = false;
  public loadingNewForm = false;

  public fileForm = this.formBuilder.nonNullable.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    cover_image: [''],
    form_xlsx: [''],
    enketo_form: [''],
    enketo_model: [''],
    enketo_definition: {},
  });

  constructor(
    private service: MonitoringFormsDashboardService,
    private route: ActivatedRoute,
    private storageService: SupabaseStorageService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {}
  async ngOnInit() {
    await this.service.ready();
    this.route.params.subscribe(async (params) => {
      this.formID = params['id'];
      if (this.formID) {
        this.service
          .getFormById(this.formID)
          .then((data) => {
            this.form = data;
            this.fileForm.patchValue({
              title: data.title ?? '', // Use empty string as a fallback if data.title is null
              cover_image: data.cover_image ?? '',
              description: data.description ?? '',
              form_xlsx: data.form_xlsx ?? '',
              enketo_form: data.enketo_form ?? '',
              enketo_model: data.enketo_model ?? '',
              enketo_definition: data.enketo_definition ?? {},
            });
          })
          .catch((error) => {
            console.error('Error fetching Form:', error);
          });
      }
    });
  }

  public async handleUploadComplete(res: IUploadResult[]) {
    if (res.length === 0) {
      return;
    }
    // As conversion is a 2-step process (xls file -> xml form -> enketo form) track progress
    // so that uploaded file can be removed if not successful

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
        this.fileForm.patchValue({
          form_xlsx: `${this.storageBucketName}/${this.storageFolderPath}/${entry.name}`,
          enketo_form: form,
          enketo_model: model,
          enketo_definition: { ...languageMap, theme },
        });
        this.convertXlsxFeedbackMessage = 'Form updated successfully!';
        this.uploading = false;
        this.xformConversionSuccess = true;
      }
    }
    // If conversion not successful delete file from storage
    if (!this.xformConversionSuccess) {
      const storagePath = `${this.storageFolderPath}/${entry.name}`;
      const { error } = await this.storageService.deleteFile(this.storageBucketName, storagePath);
      if (error) throw error;
    }
  }

  public async handleCoverUploadComplete(res: IUploadResult[], controlName: 'storage_file' | 'cover_image') {
    if (res.length === 0) {
      return;
    }
    const [{ entry }] = res;
    this.fileForm.patchValue({
      [controlName]: `${this.storageBucketName}/${this.coverImageStorageFolder}/${entry.name}`,
    });
  }
  public async handleSubmitForm() {
    const isUpdatingForm = !!this.formID;

    this.loadingNewForm = true;

    const values = this.fileForm.getRawValue();
    if (!values.title) {
      this.loadingNewForm = false;
      return;
    }
    if (isUpdatingForm) {
      const updatedValues = Object.fromEntries(Object.entries(values).filter(([key, value]) => value !== ''));
      await this.service.updateFormById(this.form.id, updatedValues);
      this.loadingNewForm = false;
      this.router.navigate([`/monitoring/${this.form.id}`]);
      return;
    }

    if (!this.xformConversionSuccess) {
      this.convertXlsxFeedbackMessage = 'Please upload a new excel form to convert!';
      this.loadingNewForm = false;
      return;
    }

    if (!isUpdatingForm) {
      await this.service.createForm(values);
      this.loadingNewForm = false;
      this.router.navigate([`/monitoring/${this.form.id}`]);
      return;
    }
  }
}
