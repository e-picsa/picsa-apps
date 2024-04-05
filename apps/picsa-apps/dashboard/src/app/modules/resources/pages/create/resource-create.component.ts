import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PICSAFormValidators } from '@picsa/forms';
import {
  IUploadResult,
  SupabaseStoragePickerDirective,
  SupabaseUploadComponent,
} from '@picsa/shared/services/core/supabase';
import { IStorageEntry } from '@picsa/shared/services/core/supabase/services/supabase-storage.service';

import { DashboardMaterialModule } from '../../../../material.module';
import { DashboardResourcesStorageLinkComponent } from '../../components/storage-link/storage-link.component';
import { ResourcesDashboardService } from '../../resources.service';
import { IResourceFileRow } from '../../types';

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
    private route: ActivatedRoute
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
    type: ['file'],
    title: ['', Validators.required],
    description: [''],
    storage_file: ['', Validators.required],
    storage_cover: [''],
  });

  private get form() {
    return this.resourceType === 'file' ? this.fileForm : this.linkForm;
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
    const values = this.form.getRawValue() as any;
    // Remove id entry if not populated
    if (values.id === null) {
      delete values.id;
    }
    const { data, error } = await this.service.tables.files.upsert(values);
    console.log({ data, error });
  }

  private populateResource(resource: any) {
    // this.resourceType = resource.type as any;
    // console.log('populate resource', resource);
    // switch (resource.type) {
    //   case 'file':
    //     this.fileForm.patchValue(resource);
    //     break;
    //   case 'link':
    //     this.linkForm.patchValue(resource);
    //     break;
    //   default:
    //     console.warn('Resource type not supported', resource.type);
    // }
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
