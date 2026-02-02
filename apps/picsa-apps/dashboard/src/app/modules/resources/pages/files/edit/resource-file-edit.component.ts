import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LOCALES_DATA } from '@picsa/data';
import { PicsaDialogService } from '@picsa/shared/features/dialog/dialog.service';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import {
  IUploadResult,
  SupabaseStoragePickerDirective,
  SupabaseUploadComponent,
} from '@picsa/shared/services/core/supabase';
import { IStorageEntry } from '@picsa/shared/services/core/supabase/services/supabase-storage.service';

import { DashboardMaterialModule } from '../../../../../material.module';
import { DeploymentDashboardService } from '../../../../deployment/deployment.service';
import { DashboardStorageLinkComponent } from '../../../../storage';
import { ResourcesDashboardService } from '../../../resources.service';
import { IResourceFileRow } from '../../../types';

@Component({
  selector: 'dashboard-resource-file-edit',
  imports: [
    DashboardMaterialModule,
    DashboardStorageLinkComponent,
    FormsModule,
    ReactiveFormsModule,
    SupabaseStoragePickerDirective,
    SupabaseUploadComponent,
  ],
  templateUrl: './resource-file-edit.component.html',
  styleUrl: './resource-file-edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceFileEditComponent implements OnInit {
  private service = inject(ResourcesDashboardService);
  private formBuilder = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private deploymentService = inject(DeploymentDashboardService);
  private notificationService = inject(PicsaNotificationService);
  private dialog = inject(PicsaDialogService);

  public storageBucketName = computed(() => this.deploymentService.activeDeployment().country_code);

  /** List of languages used in deployment available for resources */
  public languagesAvailable = computed(() => {
    const deployment = this.deploymentService.activeDeployment();
    if (deployment) {
      const languages = LOCALES_DATA.filter(
        (l) => l.country_code === deployment.country_code || l.country_code === 'global',
      );
      return languages;
    }
    return [];
  });

  public allowedFileTypes = ['pdf', 'mp4', 'mp3', 'jpg', 'jpeg', 'svg', 'png', 'webp'].map((ext) => `.${ext}`);
  public allowedCoverTypes = ['jpg', 'jpeg', 'svg', 'png'].map((ext) => `.${ext}`);

  public form = this.formBuilder.group({
    language_code: ['', Validators.required],
    title: ['', Validators.required],
    storage_file: ['', Validators.required],
    description: [''],
    cover_image: [''],
    external_url: [''],
    filename: [''],
    mimetype: [''],
    size_kb: [0],
    id: new FormControl(),
    country_code: [this.deploymentService.activeDeploymentCountry() as string, Validators.required],
  });

  public get formValidationMessage(): string {
    if (this.form.pristine) {
      return 'No changes to save';
    }
    if (this.form.valid) {
      return '';
    }

    const errors: string[] = [];
    const controls = this.form.controls;

    if (controls.title.errors?.['required']) errors.push('Title');
    if (controls.language_code.errors?.['required']) errors.push('Language');
    if (controls.storage_file.errors?.['required']) errors.push('Resource File');
    if (controls.country_code.errors?.['required']) errors.push('Country');

    if (errors.length > 0) {
      return `Missing required fields: ${errors.join(', ')}`;
    }
    return 'Form is invalid';
  }

  // HACK - temporary lookup to compare form values with db entry
  private get mergedValue() {
    const formValues = this.form.getRawValue();
    const value: IResourceFileRow = {
      created_at: '',
      md5_checksum: '',
      modified_at: '',
      updated_at: '',
      owner: '',
      sort_order: 1,
      ...formValues,
      country_code: formValues.country_code as any,
    };
    return value;
  }

  async ngOnInit() {
    await this.service.ready();
    const { id } = this.route.snapshot.params;
    if (id) {
      if (id === 'create') return;
      this.populateResource(id);
    }
  }

  // TODO - handle success/error messages
  public async saveResource() {
    this.form.disable();
    const values = this.form.getRawValue() as any;
    // Remove id entry if not populated
    if (values.id === null) {
      delete values.id;
    }
    const { data, error } = await this.service.tables.files.upsert(values).select<'*', IResourceFileRow>();
    if (data && data.length > 0) {
      this.notificationService.showSuccessNotification('Resource Saved');
      // HACK - reinit all resources to ensure update populated
      // TODO - could be made more efficient
      await this.service.refresh();

      // TODO - Add readonly view to navigate to
      this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
    }
    if (error) {
      this.form.enable();
      throw error;
    }
  }

  public async openExternalResource(url: string) {
    window.open(url, '_blank', 'noopener noreferrer nofollow');
  }

  public async promptDelete() {
    const dialog = await this.dialog.open('delete');
    dialog.afterClosed().subscribe(async (v) => {
      if (v) {
        this.form.disable();
        const res = await this.service.tables.files.delete().eq('id', this.form.value.id);
        if (res.error) {
          throw new Error(res.error.message);
          this.form.enable();
        } else {
          this.notificationService.showSuccessNotification('Resource deleted successfully');
          this.router.navigate(['../'], { relativeTo: this.route });
          // HACK - re-init service to populate list without deleted resource
          // TODO - make more efficient
          await this.service.refresh();
        }
        //
      }
    });
  }

  private async populateResource(id: string) {
    const { data } = await this.service.tables.files.select<'*', IResourceFileRow>('*').eq('id', id);
    const resource = data?.[0];
    if (resource) {
      this.form.patchValue(resource);
    } else {
      // navigate back to list page if resource not found
      // TODO - show better message
      this.router.navigate(['..'], { relativeTo: this.route });
    }
  }

  public async handleUploadComplete(res: IUploadResult[], controlName: 'storage_file' | 'cover_image') {
    if (res.length === 0) {
      return;
    }
    const [{ meta, data }] = res;
    const { bucketName, objectName } = meta;
    const storagePath = `${bucketName}/${objectName}`;
    if (controlName === 'storage_file') {
      const { size, type: mimetype, name: filename } = data as File;
      // TODO - get md5 checksum (or use supabase etag)
      this.form.patchValue({
        storage_file: storagePath,
        size_kb: Math.round(size / 1024),
        mimetype,
        filename,
      });
    } else {
      this.form.patchValue({ cover_image: storagePath });
    }
  }

  public handleStorageFileSelected(entry: IStorageEntry | undefined, controlName: 'storage_file' | 'cover_image') {
    if (entry) {
      const { bucket_id, name } = entry;
      const storagePath = `${bucket_id}/${name}`;
      if (controlName === 'storage_file') {
        const { metadata } = entry;
        const { mimetype, size } = metadata;
        this.form.patchValue({
          storage_file: storagePath,
          size_kb: Math.round(size / 1024),
          filename: storagePath.split('/').pop(),
          mimetype,
        });
      } else {
        this.form.patchValue({ cover_image: storagePath });
      }
    } else {
      this.form.patchValue({ [controlName]: '' });
    }
  }
}
