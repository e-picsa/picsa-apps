import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { Database } from '@picsa/server-types';
import { PICSAFormValidators } from '@picsa/shared/modules/forms/validators';
import { IUploadResult, SupabaseService, SupabaseUploadComponent } from '@picsa/shared/services/core/supabase';

import { DashboardMaterialModule } from '../../../material.module';
import { ResourcesDashboardService } from '../resources.service';

type IResourceEntry = Database['public']['Tables']['resources']['Row'];

@Component({
  selector: 'dashboard-resource-create',
  standalone: true,
  imports: [CommonModule, DashboardMaterialModule, FormsModule, ReactiveFormsModule, SupabaseUploadComponent],
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
  //

  public linkForm = this.formBuilder.group({
    type: ['link'],
    url: ['', PICSAFormValidators.isUrl],
  });
  public fileForm = this.formBuilder.group({
    type: ['file'],
  });

  public uploadedFile?: { name?: string; publicUrl?: string };

  async ngOnInit() {
    await this.service.ready();
    const { id } = this.route.snapshot.params;
    if (id) {
      const { data, error } = await this.supabaseService.db
        .table('resources')
        .select<'*', IResourceEntry>('*')
        .eq('id', id);
      const resource = data?.[0];
      if (resource) {
        if (resource.type === 'file') {
          this.loadFileResource(resource);
        }
      }
    }
  }

  private loadFileResource(resource: IResourceEntry) {
    console.log('laod file resource', resource);
    this.resourceType = 'file';
    if (resource.storage_file) {
      const storageEntry = this.service.storageFilesHashmap[resource.storage_file];
      if (storageEntry) {
        const { bucket_id, name, id } = storageEntry;
        const publicUrl = this.supabaseService.storage.getPublicLink(bucket_id as string, name as string);
        console.log({ storageEntry, publicUrl });
        // const {} = await this.supabaseService.db.table('');
        // console.log('fetch storage file', resource.storage_file);
        this.uploadedFile = {
          publicUrl,
          name: name?.split('/').pop() || '',
        };
      }
    }
    this.fileForm.patchValue(resource);
  }

  public async handleUploadComplete(res: IUploadResult[]) {
    if (res.length === 0) {
      this.uploadedFile = undefined;
      return;
    }
    const [{ meta }] = res;
    const { name, publicUrl } = meta;
    this.uploadedFile = { name: name.split('/').pop(), publicUrl };
    await this.service.refreshResourcesList();
  }
}
