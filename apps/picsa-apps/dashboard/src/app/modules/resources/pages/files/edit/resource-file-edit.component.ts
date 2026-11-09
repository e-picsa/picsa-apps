import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PicsaFallbackImageComponent } from '@picsa/components';
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
import { DashboardAuthService } from '../../../../auth/services/auth.service';
import { DeploymentDashboardService } from '../../../../deployment/deployment.service';
import { DashboardStorageLinkComponent } from '../../../../storage';
import { ResourcesDashboardService } from '../../../resources.service';
import { IResourceFileInsert, IResourceFileRow } from '../../../types';
import { getFileFallbackType } from '../../../utils';
import { getResourceFormValidationMessage } from '../../../utils/resource-form.utils';
import { createResourceEditPermissionState } from '../../../utils/resource-permissions.utils';

@Component({
  selector: 'dashboard-resource-file-edit',
  imports: [
    DashboardMaterialModule,
    DashboardStorageLinkComponent,
    FormsModule,
    NgTemplateOutlet,
    PicsaFallbackImageComponent,
    ReactiveFormsModule,
    SupabaseStoragePickerDirective,
    SupabaseUploadComponent,
  ],
  templateUrl: './resource-file-edit.component.html',
  styleUrl: './resource-file-edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceFileEditComponent implements OnInit {
  public readonly getFileFallbackType = getFileFallbackType;
  private service = inject(ResourcesDashboardService);
  private formBuilder = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private deploymentService = inject(DeploymentDashboardService);
  private authService = inject(DashboardAuthService);
  private notificationService = inject(PicsaNotificationService);
  private dialog = inject(PicsaDialogService);
  private cdr = inject(ChangeDetectorRef);

  public storageBucketName = computed(() => this.deploymentService.activeDeployment()?.country_code);

  /** List of languages used in deployment available for resources */
  public languagesAvailable = computed(() => {
    const deployment = this.deploymentService.activeDeployment();
    if (deployment) {
      return LOCALES_DATA.filter((l) => l.country_code === deployment.country_code);
    }
    return [];
  });

  public allowedFileTypes = ['pdf', 'mp4', 'mp3', 'jpg', 'jpeg', 'svg', 'png', 'webp'].map((ext) => `.${ext}`);
  public allowedCoverTypes = ['jpg', 'jpeg', 'svg', 'png', 'webp'].map((ext) => `.${ext}`);

  /** Extracted filename for cover image */
  public get coverFilename(): string {
    return this.form.value.cover_image?.split('/')?.pop() || '';
  }

  /** Extracted filename for resource file */
  public get resourceFilename(): string {
    return this.form.value.filename || this.form.value.storage_file?.split('/')?.pop() || '';
  }

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

  private permissions = createResourceEditPermissionState(this.authService, this.form);
  public isCreate = this.permissions.isCreate;
  private resourceOwner = this.permissions.resourceOwner;
  public canEdit = this.permissions.canEdit;

  public get formValidationMessage(): string {
    return getResourceFormValidationMessage(this.form);
  }

  async ngOnInit() {
    const { id } = this.route.snapshot.params;
    this.isCreate.set(!id || id === 'create');
    await this.service.ready();
    if (id && id !== 'create') {
      await this.populateResource(id);
    }
  }

  // TODO - handle success/error messages
  public async saveResource() {
    if (!this.canEdit()) return;
    this.form.disable();
    const rawValues = this.form.getRawValue();
    const values: IResourceFileInsert = {
      title: rawValues.title,
      description: rawValues.description,
      language_code: rawValues.language_code || null,
      storage_file: rawValues.storage_file || null,
      cover_image: rawValues.cover_image || null,
      external_url: rawValues.external_url || null,
      filename: rawValues.filename || null,
      mimetype: rawValues.mimetype || null,
      size_kb: rawValues.size_kb ?? 0,
      country_code: (rawValues.country_code ||
        this.deploymentService.activeDeploymentCountry()) as IResourceFileInsert['country_code'],
      ...(rawValues.id ? { id: rawValues.id } : {}),
    };
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
    if (!this.canEdit()) return;
    const dialog = await this.dialog.open('delete');
    dialog.afterClosed().subscribe(async (v) => {
      if (v) {
        this.form.disable();
        const currentResource = this.form.getRawValue() as unknown as IResourceFileRow;
        try {
          await this.service.deleteResourceFile(currentResource);
          this.notificationService.showSuccessNotification('Resource and associated files deleted successfully');
          this.router.navigate(['../'], { relativeTo: this.route });
        } catch (err: unknown) {
          this.form.enable();
          const message = err instanceof Error ? err.message : 'Failed to delete resource';
          this.notificationService.showErrorNotification(message);
        }
      }
    });
  }

  private async populateResource(id: string) {
    const { data } = await this.service.tables.files.select<'*', IResourceFileRow>('*').eq('id', id);
    const resource = data?.[0];
    if (resource) {
      this.resourceOwner.set(resource.owner);
      const countryCode = resource.country_code || (this.deploymentService.activeDeploymentCountry() as string);
      let language_code = resource.language_code;
      if (language_code === 'global_en' || !language_code) {
        language_code = `${countryCode}_en`;
      }
      this.form.patchValue({ ...resource, language_code });
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
      const patchValues: Record<string, any> = {
        storage_file: storagePath,
        size_kb: Math.round(size / 1024),
        mimetype,
        filename,
      };
      // If resource is an image and no custom cover is currently set, use as default cover
      if (mimetype?.startsWith('image/') && !this.form.value.cover_image) {
        patchValues['cover_image'] = storagePath;
        this.form.controls.cover_image.markAsDirty();
      }
      this.form.patchValue(patchValues);
    } else {
      this.form.patchValue({ cover_image: storagePath });
    }
    this.form.controls[controlName].markAsDirty();
    this.form.markAsDirty();
    // Reactive patchValue does not notify OnPush views - ensure template re-reads form.value
    this.cdr.markForCheck();
  }

  public handleStorageFileSelected(entry: IStorageEntry | undefined, controlName: 'storage_file' | 'cover_image') {
    if (entry) {
      const { bucket_id, name } = entry;
      const storagePath = `${bucket_id}/${name}`;
      if (controlName === 'storage_file') {
        const { metadata } = entry;
        const { mimetype, size } = metadata;
        const patchValues: Record<string, any> = {
          storage_file: storagePath,
          size_kb: Math.round(size / 1024),
          filename: storagePath.split('/').pop(),
          mimetype,
        };
        if (mimetype?.startsWith('image/') && !this.form.value.cover_image) {
          patchValues['cover_image'] = storagePath;
          this.form.controls.cover_image.markAsDirty();
        }
        this.form.patchValue(patchValues);
      } else {
        this.form.patchValue({ cover_image: storagePath });
      }
    } else {
      this.form.patchValue({ [controlName]: '' });
    }
    this.form.controls[controlName].markAsDirty();
    this.form.markAsDirty();
    // Reactive patchValue does not notify OnPush views - ensure template re-reads form.value
    this.cdr.markForCheck();
  }
}
