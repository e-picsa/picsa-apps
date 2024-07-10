import { CommonModule } from '@angular/common';
import { Component, computed, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LOCALES_DATA, LOCALES_DATA_HASHMAP } from '@picsa/data';
import { PICSAFormValidators } from '@picsa/forms';
import {
  IUploadResult,
  SupabaseStoragePickerDirective,
  SupabaseUploadComponent,
} from '@picsa/shared/services/core/supabase';
import { IStorageEntry } from '@picsa/shared/services/core/supabase/services/supabase-storage.service';

import { DashboardMaterialModule } from '../../../../../material.module';
import { DeploymentDashboardService } from '../../../../deployment/deployment.service';
import { DashboardResourcesStorageLinkComponent } from '../../../components/storage-link/storage-link.component';
import { ResourcesDashboardService } from '../../../resources.service';
import { IResourceFileRow } from '../../../types';

@Component({
  selector: 'dashboard-resource-file-edit',
  standalone: true,
  imports: [
    CommonModule,
    DashboardMaterialModule,
    DashboardResourcesStorageLinkComponent,
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
    private deploymentService: DeploymentDashboardService
  ) {}

  /** List of languages used in deployment available for resources */
  public languagesAvailable = computed(() => {
    const deployment = this.deploymentService.activeDeployment();
    if (deployment) {
      const languages = LOCALES_DATA.filter(
        (l) => l.country_code === deployment.country_code || l.country_code === 'global'
      );
      console.log('languages available', languages);
      return languages;
    }
    return [];
  });

  public allowedFileTypes = ['pdf', 'mp4', 'mp3', 'jpg', 'jpeg', 'svg', 'png', 'webp'].map((ext) => `.${ext}`);
  public allowedCoverTypes = ['jpg', 'jpeg', 'svg', 'png'].map((ext) => `.${ext}`);

  public form = this.formBuilder.group({
    id: new FormControl<string | null>(null),
    type: ['file'],
    language_code: ['', Validators.required],
    title: ['', Validators.required],
    description: [''],
    storage_file: ['', Validators.required],
    storage_cover: [''],
  });

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
    const values = this.form.getRawValue() as any;
    // Remove id entry if not populated
    if (values.id === null) {
      delete values.id;
    }
    const { data, error } = await this.service.tables.files.upsert(values);
    console.log({ data, error });
  }

  private populateResource(resource: IResourceFileRow) {
    console.log('populate resource', resource);
    this.form.patchValue(resource);
    console.log('formValue', this.form.value);
  }

  public async handleUploadComplete(res: IUploadResult[], controlName: 'storage_file' | 'storage_cover') {
    if (res.length === 0) {
      return;
    }
    const [{ entry }] = res;
    this.form.patchValue({ [controlName]: entry.id });
  }

  public handleStorageFileSelected(entry: IStorageEntry | undefined, controlName: 'storage_file' | 'storage_cover') {
    this.form.patchValue({ [controlName]: entry?.id });
  }
}
