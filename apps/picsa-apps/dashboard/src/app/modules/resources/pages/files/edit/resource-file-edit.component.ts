import { CommonModule } from '@angular/common';
import { Component, computed, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LOCALES_DATA } from '@picsa/data';
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
  standalone: true,
  imports: [
    CommonModule,
    DashboardMaterialModule,
    DashboardStorageLinkComponent,
    FormsModule,
    ReactiveFormsModule,
    SupabaseStoragePickerDirective,
    SupabaseUploadComponent,
  ],
  templateUrl: './resource-file-edit.component.html',
  styleUrl: './resource-file-edit.component.scss',
})
export class ResourceFileEditComponent implements OnInit {
  constructor(
    private service: ResourcesDashboardService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private deploymentService: DeploymentDashboardService,
    private notificationService: PicsaNotificationService
  ) {}

  public storageBucketName = computed(() => this.deploymentService.activeDeployment()!.country_code);

  /** List of languages used in deployment available for resources */
  public languagesAvailable = computed(() => {
    const deployment = this.deploymentService.activeDeployment();
    if (deployment) {
      const languages = LOCALES_DATA.filter(
        (l) => l.country_code === deployment.country_code || l.country_code === 'global'
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
  });

  // HACK - temporary lookup to compare form values with db entry
  private get mergedValue() {
    const formValues = this.form.getRawValue();
    const value: IResourceFileRow = {
      // assume all new resources are shared globally
      // TODO - should link to deployment in future
      country_code: 'global',
      id: '',
      created_at: '',
      md5_checksum: '',
      modified_at: '',
      sort_order: 1,
      ...formValues,
    };
    return value;
  }

  async ngOnInit() {
    await this.service.ready();
    const { id } = this.route.snapshot.params;
    if (id) {
      const { data } = await this.service.tables.files.select<'*', IResourceFileRow>('*').eq('id', id);
      const resource = data?.[0];
      if (resource) {
        this.populateResource(resource);
      }
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
      const [{ id }] = data;
      this.notificationService.showUserNotification({ matIcon: 'verified', message: 'Resource Saved' });
      this.router.navigate(['../', id], { relativeTo: this.route, replaceUrl: true });
    }
    if (error) {
      this.form.enable();
      throw error;
    }
  }

  public async openExternalResource(url: string) {
    window.open(url, '_blank', 'noopener noreferrer nofollow');
  }

  private populateResource(resource: IResourceFileRow) {
    this.form.patchValue({ ...resource });
  }

  public async handleUploadComplete(res: IUploadResult[], controlName: 'storage_file' | 'cover_image') {
    if (res.length === 0) {
      return;
    }
    const [{ entry, data }] = res;
    if (controlName === 'storage_file') {
      const { size, type: mimetype, name: filename } = data as File;
      // TODO - get md5 checksum (or use supabase etag)
      this.form.patchValue({
        storage_file: `${this.storageBucketName()}/resources/${entry.name}`,
        size_kb: Math.round(size / 1024),
        mimetype,
        filename,
      });
    } else {
      this.form.patchValue({ cover_image: `${this.storageBucketName()}/resources/covers/${entry.name}` });
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
