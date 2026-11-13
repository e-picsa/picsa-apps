import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LOCALES_DATA } from '@picsa/data';
import { PicsaDialogService } from '@picsa/shared/features/dialog/dialog.service';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';

import { DashboardMaterialModule } from '../../../../../material.module';
import { DashboardAuthService } from '../../../../auth/services/auth.service';
import { DeploymentDashboardService } from '../../../../deployment/deployment.service';
import { DashboardStorageUploadComponent, IStorageUploadFileMeta } from '../../../../storage';
import { ResourcesDashboardService } from '../../../resources.service';
import { IResourceFileInsert, IResourceFileRow } from '../../../types';
import { getResourceFormValidationMessage } from '../../../utils/resource-form.utils';
import { createResourceEditPermissionState } from '../../../utils/resource-permissions.utils';

@Component({
  selector: 'dashboard-resource-file-edit',
  imports: [DashboardMaterialModule, DashboardStorageUploadComponent, FormsModule, ReactiveFormsModule],
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
  private authService = inject(DashboardAuthService);
  private notificationService = inject(PicsaNotificationService);
  private dialog = inject(PicsaDialogService);

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
  public allowedCoverTypes = ['jpg', 'jpeg', 'svg', 'png'].map((ext) => `.${ext}`);

  public collections = this.service.collections;

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
    collections: new FormControl<string[]>([]),
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
    };

    try {
      const query = rawValues.id
        ? this.service.tables.files.update(values).eq('id', rawValues.id)
        : this.service.tables.files.insert(values);
      const { data, error } = await query.select<'*', IResourceFileRow>().single();
      if (error) {
        throw new Error(error.message);
      }
      if (data) {
        await this.service.syncResourceCollections('files', data.id, rawValues.collections || []);

        this.notificationService.showSuccessNotification('Resource Saved');
        await this.service.refresh();

        this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
      }
    } catch (err: unknown) {
      this.form.enable();
      const message = err instanceof Error ? err.message : 'Failed to save resource';
      this.notificationService.showErrorNotification(message);
    }
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

  public handleStorageFileMetadata(meta: IStorageUploadFileMeta | undefined) {
    if (meta) {
      this.form.patchValue({
        size_kb: meta.size_kb ?? 0,
        mimetype: meta.mimetype || '',
        filename: meta.filename || '',
      });
    } else {
      this.form.patchValue({
        size_kb: 0,
        mimetype: '',
        filename: '',
      });
    }
  }

  private async populateResource(id: string) {
    const countryCode = this.deploymentService.activeDeploymentCountry() as IResourceFileRow['country_code'];
    let query = this.service.tables.files.select<'*', IResourceFileRow>('*').eq('id', id);
    if (countryCode) {
      query = query.eq('country_code', countryCode);
    }
    const { data } = await query;
    const resource = data?.[0];
    if (resource) {
      this.resourceOwner.set(resource.owner);
      const resolvedCountryCode = resource.country_code || (this.deploymentService.activeDeploymentCountry() as string);
      let language_code = resource.language_code;
      if (language_code === 'global_en' || !language_code) {
        language_code = `${resolvedCountryCode}_en`;
      }
      const assignedCollections = this.service.getResourceCollections('files', id).map((c) => c.id);
      this.form.patchValue({ ...resource, language_code, collections: assignedCollections });
    } else {
      this.router.navigate(['..'], { relativeTo: this.route });
    }
  }
}
