import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PicsaDialogService } from '@picsa/shared/features/dialog/dialog.service';
import { SizeMBPipe } from '@picsa/shared/pipes/sizeMB';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { StoragePathPipe } from '@picsa/shared/services/core/supabase';

import { DashboardMaterialModule } from '../../../../../material.module';
import { DashboardAuthService } from '../../../../auth/services/auth.service';
import { DeploymentDashboardService } from '../../../../deployment/deployment.service';
import { DashboardStorageUploadComponent } from '../../../../storage';
import { ResourcesDashboardService } from '../../../resources.service';
import { IResourceCollectionRow, IResourceFileRow, IResourceLinkRow } from '../../../types';
import { getResourceFormValidationMessage } from '../../../utils/resource-form.utils';
import { createResourceEditPermissionState } from '../../../utils/resource-permissions.utils';

@Component({
  selector: 'dashboard-resource-collection-edit',
  imports: [
    CommonModule,
    DashboardMaterialModule,
    DashboardStorageUploadComponent,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    SizeMBPipe,
    StoragePathPipe,
  ],
  templateUrl: './resource-collection-edit.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceCollectionEditComponent implements OnInit {
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

  public isSaving = signal(false);

  public form = this.formBuilder.group({
    id: new FormControl<string | null>(null),
    title: ['', Validators.required],
    description: [''],
    cover_image: [''],
    country_code: [this.deploymentService.activeDeploymentCountry() as string, Validators.required],
    resource_files: new FormControl<string[]>([]),
    resource_links: new FormControl<string[]>([]),
  });

  private permissions = createResourceEditPermissionState(this.authService, this.form, {
    allowAnyEditorEdit: true,
  });
  public isCreate = this.permissions.isCreate;
  public resourceOwner = this.permissions.resourceOwner;
  public canEdit = this.permissions.canEdit;
  public canDelete = this.permissions.canDelete;

  public filesSearch = signal('');
  public linksSearch = signal('');
  public filesViewFilter = signal<'all' | 'selected'>('all');
  public linksViewFilter = signal<'all' | 'selected'>('all');

  public selectedFileIdsList = toSignal(this.form.controls.resource_files.valueChanges, {
    initialValue: this.form.controls.resource_files.value ?? [],
  });
  public selectedLinkIdsList = toSignal(this.form.controls.resource_links.valueChanges, {
    initialValue: this.form.controls.resource_links.value ?? [],
  });

  public selectedFileIds = computed(() => new Set(this.selectedFileIdsList() ?? []));
  public selectedLinkIds = computed(() => new Set(this.selectedLinkIdsList() ?? []));

  public totalFilesCount = computed(() => this.service.files().length);
  public totalLinksCount = computed(() => this.service.links().length);

  public filteredFiles = computed<IResourceFileRow[]>(() => {
    const query = this.filesSearch().trim().toLowerCase();
    const filterMode = this.filesViewFilter();
    const selected = this.selectedFileIds();

    return this.service.files().filter((file) => {
      if (filterMode === 'selected' && !selected.has(file.id)) return false;
      if (!query) return true;
      return (
        file.title?.toLowerCase().includes(query) ||
        file.filename?.toLowerCase().includes(query) ||
        file.language_code?.toLowerCase().includes(query)
      );
    });
  });

  public filteredLinks = computed<IResourceLinkRow[]>(() => {
    const query = this.linksSearch().trim().toLowerCase();
    const filterMode = this.linksViewFilter();
    const selected = this.selectedLinkIds();

    return this.service.links().filter((link) => {
      if (filterMode === 'selected' && !selected.has(link.id)) return false;
      if (!query) return true;
      return (
        link.title?.toLowerCase().includes(query) ||
        link.url?.toLowerCase().includes(query) ||
        link.type?.toLowerCase().includes(query)
      );
    });
  });

  public get formValidationMessage(): string {
    return getResourceFormValidationMessage(this.form);
  }

  async ngOnInit() {
    const { id } = this.route.snapshot.params;
    this.isCreate.set(!id || id === 'create');
    await this.service.ready();
    if (id && id !== 'create') {
      await this.populateCollection(id);
    }
  }

  public toggleFile(fileId: string) {
    if (!this.canEdit()) return;
    const current = this.form.controls.resource_files.value ?? [];
    const next = current.includes(fileId) ? current.filter((id) => id !== fileId) : [...current, fileId];
    this.form.controls.resource_files.setValue(next);
    this.form.controls.resource_files.markAsDirty();
    this.form.markAsDirty();
  }

  public toggleLink(linkId: string) {
    if (!this.canEdit()) return;
    const current = this.form.controls.resource_links.value ?? [];
    const next = current.includes(linkId) ? current.filter((id) => id !== linkId) : [...current, linkId];
    this.form.controls.resource_links.setValue(next);
    this.form.controls.resource_links.markAsDirty();
    this.form.markAsDirty();
  }

  public getLinkIcon(type: IResourceLinkRow['type']): string {
    switch (type) {
      case 'app':
        return 'smartphone';
      case 'social':
        return 'share';
      default:
        return 'language';
    }
  }

  public async saveCollection() {
    if (!this.canEdit() || this.isSaving()) return;
    this.isSaving.set(true);
    this.form.disable();
    const rawValues = this.form.getRawValue();

    try {
      await this.service.saveCollection({
        id: rawValues.id || undefined,
        title: rawValues.title || '',
        description: rawValues.description || null,
        cover_image: rawValues.cover_image || null,
        country_code: rawValues.country_code as IResourceCollectionRow['country_code'],
        resource_files: rawValues.resource_files || [],
        resource_links: rawValues.resource_links || [],
      });
      this.notificationService.showSuccessNotification('Collection Saved');
      this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
    } catch (err: unknown) {
      this.form.enable();
      const message = err instanceof Error ? err.message : 'Failed to save collection';
      this.notificationService.showErrorNotification(message);
    } finally {
      this.isSaving.set(false);
    }
  }

  public async promptDelete() {
    if (!this.canDelete()) return;
    const dialog = await this.dialog.open('delete');
    dialog.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        this.form.disable();
        const current = this.form.getRawValue() as unknown as IResourceCollectionRow;
        try {
          await this.service.deleteResourceCollection(current);
          this.notificationService.showSuccessNotification('Collection deleted successfully');
          this.router.navigate(['../'], { relativeTo: this.route });
        } catch (err: unknown) {
          this.form.enable();
          const message = err instanceof Error ? err.message : 'Failed to delete collection';
          this.notificationService.showErrorNotification(message);
        }
      }
    });
  }

  private async populateCollection(id: string) {
    const countryCode = this.deploymentService.activeDeploymentCountry() as IResourceCollectionRow['country_code'];
    let query = this.service.tables.collections.select<'*', IResourceCollectionRow>('*').eq('id', id);
    if (countryCode) {
      query = query.eq('country_code', countryCode);
    }
    const { data } = await query;
    const collection = data?.[0];
    if (collection) {
      this.resourceOwner.set(collection.owner);
      this.form.patchValue({
        id: collection.id,
        title: collection.title,
        description: collection.description || '',
        cover_image: collection.cover_image || '',
        country_code: collection.country_code || (this.deploymentService.activeDeploymentCountry() as string),
        resource_files: collection.resource_files || [],
        resource_links: collection.resource_links || [],
      });
    } else {
      this.router.navigate(['..'], { relativeTo: this.route });
    }
  }
}
