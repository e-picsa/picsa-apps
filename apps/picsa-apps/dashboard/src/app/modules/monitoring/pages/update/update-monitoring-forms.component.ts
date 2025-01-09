import { ChangeDetectionStrategy, Component, computed, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Router } from '@angular/router';
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { Database } from '@picsa/server-types';
import { PicsaLoadingComponent } from '@picsa/shared/features/loading/loading';
import {
  IUploadResult,
  SupabaseStoragePickerDirective,
  SupabaseUploadComponent,
} from '@picsa/shared/services/core/supabase';
import {
  IStorageEntry,
  SupabaseStorageService,
} from '@picsa/shared/services/core/supabase/services/supabase-storage.service';
import { UppyFile } from '@uppy/core';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { v4 as uuidV4 } from 'uuid';

import { DashboardMaterialModule } from '../../../../material.module';
import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { MonitoringFormsDashboardService } from '../../monitoring.service';

export type IMonitoringFormsRow = Database['public']['Tables']['monitoring_forms']['Row'];

@Component({
  selector: 'dashboard-monitoring-update',
  imports: [
    DashboardMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgxJsonViewerModule,
    SupabaseUploadComponent,
    SupabaseStoragePickerDirective,
    PicsaLoadingComponent,
  ],
  templateUrl: './update-monitoring-forms.component.html',
  styleUrls: ['./update-monitoring-forms.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateMonitoringFormsComponent implements OnInit {
  public convertXlsxFeedbackMessage = '';
  public allowedFileTypes = ['xlsx', 'xls'].map((ext) => `.${ext}`);
  public allowedCoverTypes = ['jpg', 'jpeg', 'svg', 'png'].map((ext) => `.${ext}`);
  public storageBucketName = computed(() => this.deploymentService.activeDeployment()!.country_code);
  public storageFolderPath = 'monitoring/forms';
  public coverImageStorageFolder = 'monitoring/cover_images';
  public formID: string | null = null;
  public loadingNewForm = false;

  private monitoringRow: IMonitoringFormsRow;

  public form = this.formBuilder.group({
    title: new FormControl<string>('', { nonNullable: true, validators: Validators.required }),
    description: new FormControl<string>('', { nonNullable: true, validators: Validators.required }),
    cover_image: new FormControl<string>(null as any),
    form_xlsx: new FormControl<string>('', { nonNullable: true, validators: Validators.required }),
    enketo_form: new FormControl<string>('', { nonNullable: true, validators: Validators.required }),
    enketo_model: new FormControl<string>('', { nonNullable: true, validators: Validators.required }),
    enketo_definition: new FormControl<any>({}, { nonNullable: true, validators: Validators.required }),
  });

  @ViewChild('formUploader') formUploader: SupabaseUploadComponent;

  constructor(
    private service: MonitoringFormsDashboardService,
    private route: ActivatedRoute,
    private storageService: SupabaseStorageService,
    private formBuilder: FormBuilder,
    private router: Router,
    private deploymentService: DeploymentDashboardService
  ) {}
  async ngOnInit() {
    await this.service.ready();
    this.route.params.subscribe(async (params) => {
      this.formID = params['id'];
      if (this.formID) {
        this.service
          .getFormById(this.formID)
          .then((data) => {
            this.monitoringRow = data;
            this.form.patchValue(data as any);
          })
          .catch((error) => {
            console.error('Error fetching Form:', error);
          });
      }
    });
  }

  public async handleFormFileChanged(file?: UppyFile) {
    if (file) {
      await this.handleFormConversion(file.data as File);
    } else {
      // TODO - remove uploaded file and reset form
      console.log('TODO - remove form entry', this.form.value);
      //   const storagePath = `${this.storageFolderPath}/${entry.name}`;
      //   const { error } = await this.storageService.deleteFile(this.storageBucketName(), storagePath);
      //   if (error) throw error;
    }
  }

  public async handleFormFileSelected(entry?: IStorageEntry) {
    if (entry) {
      const url = this.storageService.getPublicLink(entry.bucket_id as string, entry.name as string);
      // TODO - convert to file object and pass to converter
    }
  }

  public handleCoverFileSelected(entry?: IStorageEntry) {
    if (entry) {
      this.form.patchValue({ cover_image: `${entry.bucket_id}/${entry.name}` });
    } else {
      this.form.patchValue({ cover_image: null });
    }
  }

  /**
   * When the user drops an xlsx file for upload first verify it can be converted to
   * xlsform and enketo versions before uploading to supabase and marking form
   */
  private async handleFormConversion(file: File) {
    this.form.disable();

    // Step 1 - xlsx convert to xform
    this.convertXlsxFeedbackMessage = 'Preparing xform...';
    const xform = await this.service.submitFormToConvertXlsToXForm(file as File);

    // Step 2 - xform convert to enketo
    if (xform) {
      this.convertXlsxFeedbackMessage = 'Preparing enketo form...';
      const blob = new Blob([xform], { type: 'text/xml' });
      const xmlFile = new File([blob], 'form.xml', { type: 'text/xml' });
      const formData = new FormData();
      formData.append('files', xmlFile);
      const enketoContent = await this.service.submitFormToConvertXFormToEnketo(formData);
      // Step 3 - upload form to supabase
      if (enketoContent) {
        this.convertXlsxFeedbackMessage = 'Uploading to storage...';
        const { successful, failed } = await this.formUploader.startUpload();
        const [entry] = successful;

        // Step 4 - update form values
        if (entry) {
          const { form, languageMap, model, theme } = enketoContent;
          this.form.patchValue({
            enketo_form: this.encodeEnketoHTML(form),
            enketo_model: this.encodeEnketoXML(model),
            enketo_definition: { ...languageMap, theme },
            form_xlsx: `${this.storageBucketName()}/${this.storageFolderPath}/${entry.name}`,
          });
          this.convertXlsxFeedbackMessage = 'Form uploaded successfully!';
        }
      }
    }

    this.convertXlsxFeedbackMessage = '';
    this.form.enable();
  }

  public async handleCoverUploadComplete(res: IUploadResult[]) {
    if (res.length === 0) {
      return;
    }
    const [{ meta }] = res;
    this.form.patchValue({
      cover_image: `${meta.bucketName}/${meta.objectName}`,
    });
  }
  public async handleSubmitForm() {
    const values = this.form.getRawValue();
    // handle update
    if (this.formID) {
      const updatedValues = Object.fromEntries(Object.entries(values).filter(([key, value]) => value !== ''));
      await this.service.updateFormById(this.monitoringRow.id, updatedValues);
      this.router.navigate([`/monitoring/${this.monitoringRow.id}`]);
    }
    // handle create
    else {
      this.formID = uuidV4();
      await this.service.createForm({ ...values, id: this.formID });
    }
    this.router.navigate([`/monitoring/${this.formID}`]);
  }

  /** Replace html entities and encode as base64 */
  private encodeEnketoHTML(html: string) {
    const replaced = html.replace(/&gt;/g, '>').replace(/&lt;/g, '<');
    return btoa(replaced);
  }

  /** Encode as base64 */
  private encodeEnketoXML(xml: string) {
    return btoa(xml);
  }
}
