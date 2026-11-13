import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PICSAFormValidators } from '@picsa/forms';
import { PicsaDialogService } from '@picsa/shared/features/dialog/dialog.service';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';

import { DashboardMaterialModule } from '../../../../../material.module';
import { DashboardAuthService } from '../../../../auth/services/auth.service';
import { DeploymentDashboardService } from '../../../../deployment/deployment.service';
import { DashboardStorageUploadComponent } from '../../../../storage';
import { ResourcesDashboardService } from '../../../resources.service';
import { IResourceLinkInsert, IResourceLinkRow } from '../../../types';
import { getResourceFormValidationMessage } from '../../../utils/resource-form.utils';
import { createResourceEditPermissionState } from '../../../utils/resource-permissions.utils';

@Component({
  selector: 'dashboard-resource-link-edit',
  imports: [DashboardMaterialModule, DashboardStorageUploadComponent, FormsModule, ReactiveFormsModule],
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

  public collections = this.service.collections;

  public form = this.formBuilder.group({
    id: new FormControl<string | null>(null),
    title: ['', Validators.required],
    description: [''],
    type: ['web', Validators.required],
    url: ['', [Validators.required, PICSAFormValidators.isUrl]],
    cover_image: [''],
    collections: new FormControl<string[]>([]),
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
    const values: IResourceLinkInsert = {
      title: rawValues.title,
      description: rawValues.description,
      type: (rawValues.type || 'web') as IResourceLinkInsert['type'],
      url: rawValues.url || '',
      cover_image: rawValues.cover_image || null,
      country_code: (rawValues.country_code ||
        this.deploymentService.activeDeploymentCountry()) as IResourceLinkInsert['country_code'],
    };

    try {
      const query = rawValues.id
        ? this.service.tables.links.update(values).eq('id', rawValues.id)
        : this.service.tables.links.insert(values);
      const { data, error } = await query.select<'*', IResourceLinkRow>().single();
      if (error) {
        throw new Error(error.message);
      }
      if (data) {
        await this.service.syncResourceCollections('links', data.id, rawValues.collections || []);

        this.notificationService.showSuccessNotification('Resource Link Saved');
        await this.service.refresh();
        this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
      }
    } catch (err: unknown) {
      this.form.enable();
      const message = err instanceof Error ? err.message : 'Failed to save resource link';
      this.notificationService.showErrorNotification(message);
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

  private async populateResource(id: string) {
    const countryCode = this.deploymentService.activeDeploymentCountry() as IResourceLinkRow['country_code'];
    let query = this.service.tables.links.select<'*', IResourceLinkRow>('*').eq('id', id);
    if (countryCode) {
      query = query.eq('country_code', countryCode);
    }
    const { data } = await query;
    const resource = data?.[0];
    if (resource) {
      this.resourceOwner.set(resource.owner);
      const assignedCollections = this.service.getResourceCollections('links', resource.id).map((c) => c.id);
      this.form.patchValue({
        id: resource.id,
        title: resource.title || '',
        description: resource.description || '',
        type: resource.type || 'web',
        url: resource.url || '',
        cover_image: resource.cover_image || '',
        collections: assignedCollections,
        country_code: resource.country_code || this.deploymentService.activeDeploymentCountry(),
      });
    } else {
      this.router.navigate(['..'], { relativeTo: this.route });
    }
  }
}
