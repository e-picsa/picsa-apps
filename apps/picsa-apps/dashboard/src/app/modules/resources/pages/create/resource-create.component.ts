import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { Database } from '@picsa/server-types';
import { PICSAFormValidators } from '@picsa/shared/modules/forms/validators';
import {
  IUploadResult,
  SupabaseService,
  SupabaseStoragePickerDirective,
  SupabaseUploadComponent,
} from '@picsa/shared/services/core/supabase';
import { IStorageEntry } from '@picsa/shared/services/core/supabase/services/supabase-storage.service';

import { DashboardMaterialModule } from '../../../../material.module';
import { DashboardResourcesStorageLinkComponent } from '../../components/storage-link/storage-link.component';
import { ResourcesDashboardService } from '../../resources.service';

type IResourceEntry = Database['public']['Tables']['resources']['Row'];

@Component({
  selector: 'dashboard-resource-create',
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
  templateUrl: './resource-create.component.html',
  styleUrls: ['./resource-create.component.scss'],
})
export class ResourceCreateComponent implements OnInit {
  constructor(
    private service: ResourcesDashboardService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private supabaseService: SupabaseService
  ) {}

  public resourceType: 'file' | 'link';

  public allowedFileTypes = ['pdf', 'mp4', 'mp3', 'jpg', 'jpeg', 'svg', 'png', 'webp'].map((ext) => `.${ext}`);
  public allowedCoverTypes = ['jpg', 'jpeg', 'svg', 'png'].map((ext) => `.${ext}`);

  public linkForm = this.formBuilder.group({
    id: new FormControl<string | null>(null),
    type: ['link'],
    url: ['', PICSAFormValidators.isUrl],
  });
  public fileForm = this.formBuilder.group({
    id: new FormControl<string | null>(null),
    title: ['', Validators.required],
    type: ['file'],
    storage_file: ['', Validators.required],
    storage_cover: ['', Validators.required],
  });

  private get form() {
    return this.resourceType === 'file' ? this.fileForm : this.linkForm;
  }

  async ngOnInit() {
    await this.service.ready();
    const { id } = this.route.snapshot.params;
    if (id) {
      const { data } = await this.supabaseService.db.table('resources').select<'*', IResourceEntry>('*').eq('id', id);
      const resource = data?.[0];
      if (resource) {
        this.populateResource(resource);
      }
    }
  }

  public async saveResource() {
    console.log('save resource', this.form.value);
    const { data, error } = await this.supabaseService.db.table('resources').upsert(this.form.value);
    console.log({ data, error });
  }

  private populateResource(resource: IResourceEntry) {
    this.resourceType = resource.type as any;
    switch (resource.type) {
      case 'file':
        this.fileForm.patchValue(resource);
        break;
      case 'link':
        this.linkForm.patchValue(resource);
        break;
      default:
        console.warn('Resource type not supported', resource.type);
    }
  }

  public async handleUploadComplete(res: IUploadResult[], controlName: 'storage_file' | 'storage_cover') {
    if (res.length === 0) {
      return;
    }
    const [{ entry }] = res;
    this.fileForm.patchValue({ [controlName]: entry.id });
  }

  public handleStorageFileSelected(entry: IStorageEntry | undefined, controlName: 'storage_file' | 'storage_cover') {
    this.fileForm.patchValue({ [controlName]: entry?.id });
  }
}
