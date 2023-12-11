import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Database } from '@picsa/server-types';
import { PICSAFormValidators } from '@picsa/shared/modules/forms/validators';
import { IUploadResult, SupabaseService, SupabaseUploadComponent } from '@picsa/shared/services/core/supabase';

import { DashboardMaterialModule } from '../../../material.module';

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

  public uploadedFile: IUploadResult;

  async ngOnInit() {
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
      // const {} = await this.supabaseService.db.table('');
      // console.log('fetch storage file', resource.storage_file);
    }
    this.fileForm.patchValue(resource);
    // this.uploadedFile = { data: {}, meta: {} };
  }

  public async handleUploadComplete(res: IUploadResult[]) {
    this.uploadedFile = res[0];
  }
}
