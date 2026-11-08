import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PICSAFormValidators } from '@picsa/forms';
import { PicsaDialogService } from '@picsa/shared/features/dialog/dialog.service';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import {
  IUploadResult,
  SupabaseStoragePickerDirective,
  SupabaseUploadComponent,
} from '@picsa/shared/services/core/supabase';
import { IStorageEntry } from '@picsa/shared/services/core/supabase/services/supabase-storage.service';
import { capitalise } from '@picsa/utils';

import { DashboardMaterialModule } from '../../../../../material.module';
import { DashboardAuthService } from '../../../../auth/services/auth.service';
import { DeploymentDashboardService } from '../../../../deployment/deployment.service';
import { DashboardStorageLinkComponent } from '../../../../storage';
import { ResourcesDashboardService } from '../../../resources.service';
import { IResourceLinkInsert, IResourceLinkRow } from '../../../types';
import { createResourceEditPermissionState } from '../../../utils/resource-permissions.utils';

@Component({
  selector: 'dashboard-resource-link-edit',
  imports: [
    DashboardMaterialModule,
    DashboardStorageLinkComponent,
    FormsModule,
    ReactiveFormsModule,
    SupabaseStoragePickerDirective,
    SupabaseUploadComponent,
  ],
  templateUrl: './resource-link-edit.component.html',
  styleUrl: './resource-link-edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceLinkEditComponent implements OnInit {
  private service = inject(ResourcesDashboardService);
  private formBuilder = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private deploymentService = inject(DeploymentDashboardService);
  private authService = inject(DashboardAuthService);
  private notificationService = inject(PicsaNotificationService);
  private dialog = inject(PicsaDialogService);

  public storageBucketName = computed(() => this.deploymentService.activeDeployment()?.country_code);
  public allowedCoverTypes = ['jpg', 'jpeg', 'svg', 'png', 'webp'].map((ext) => `.${ext}`);

  public form = this.formBuilder.group({
    id: new FormControl<string | null>(null),
    title: ['', Validators.required],
    description: [''],
    type: ['web', Validators.required],
    url: ['', [Validators.required, PICSAFormValidators.isUrl]],
    cover_image: [''],
    country_code: [this.deploymentService.activeDeploymentCountry() as string, Validators.required],
  });

  private permissions = createResourceEditPermissionState(this.authService, this.form);
  public isCreate = this.permissions.isCreate;
  private resourceOwner = this.permissions.resourceOwner;
  public canEdit = this.permissions.canEdit;

  public get formValidationMessage(): string {
    if (this.form.pristine) {
      return 'No changes to save';
    }
    if (this.form.valid) {
      return '';
    }

    const errors: string[] = [];
    const controls = this.form.controls;

    Object.keys(controls).forEach((key) => {
      const control = this.form.get(key);
      if (control?.errors?.['required']) {
        const fieldName = key.split('_').map(capitalise).join(' ');
        errors.push(fieldName);
      }
    });

    if (errors.length > 0) {
      return `Missing required fields: ${errors.join(', ')}`;
    }
    return 'Form is invalid';
  }

  async ngOnInit() {
    const { id } = this.route.snapshot.params;
    this.isCreate.set(!id || id === 'create');
    await this.service.ready();
    if (id && id !== 'create') {
      const { data } = await this.service.tables.links.select<'*', IResourceLinkRow>('*').eq('id', id);
      const resource = data?.[0];
      if (resource) {
        this.resourceOwner.set(resource.owner);
        this.populateResource(resource);
      }
    }
  }

  public async saveResource() {
    if (!this.canEdit()) return;
    this.form.disable();
    const rawValues = this.form.getRawValue();
    const values: IResourceLinkInsert = {
      title: rawValues.title,
      description: rawValues.description,
      type: (rawValues.type || 'web') as IResourceLinkInsert['type'],
      url: rawValues.url || '',
      cover_image: rawValues.cover_image || null,
      country_code: (rawValues.country_code || null) as IResourceLinkInsert['country_code'],
      ...(rawValues.id ? { id: rawValues.id } : {}),
    };
    const { data, error } = await this.service.tables.links.upsert(values).select<'*', IResourceLinkRow>();
    if (data && data.length > 0) {
      this.notificationService.showSuccessNotification('Resource Link Saved');
      await this.service.refresh();
      this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
    }
    if (error) {
      this.form.enable();
      this.notificationService.showErrorNotification(error.message);
    }
  }

  public async promptDelete() {
    if (!this.canEdit()) return;
    const dialog = await this.dialog.open('delete');
    dialog.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        this.form.disable();
        const currentLink = this.form.getRawValue() as unknown as IResourceLinkRow;
        try {
          await this.service.deleteResourceLink(currentLink);
          this.notificationService.showSuccessNotification('Resource link deleted successfully');
          this.router.navigate(['../'], { relativeTo: this.route });
        } catch (err: unknown) {
          this.form.enable();
          const message = err instanceof Error ? err.message : 'Failed to delete resource link';
          this.notificationService.showErrorNotification(message);
        }
      }
    });
  }

  public handleStorageFileSelected(entry: IStorageEntry | undefined) {
    const storagePath = entry ? `${entry.bucket_id}/${entry.name}` : '';
    this.form.patchValue({ cover_image: storagePath });
    this.form.markAsDirty();
  }

  public async handleUploadComplete(res: IUploadResult[]) {
    if (res.length === 0) return;
    const [{ meta }] = res;
    const storagePath = `${meta.bucketName}/${meta.objectName}`;
    this.form.patchValue({ cover_image: storagePath });
    this.form.markAsDirty();
  }

  private populateResource(resource: IResourceLinkRow) {
    this.form.patchValue({
      id: resource.id,
      title: resource.title || '',
      description: resource.description || '',
      type: resource.type || 'web',
      url: resource.url || '',
      cover_image: resource.cover_image || '',
      country_code: resource.country_code || this.deploymentService.activeDeploymentCountry(),
    });
  }
}
