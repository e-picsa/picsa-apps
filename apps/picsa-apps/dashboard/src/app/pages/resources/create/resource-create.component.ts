import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PICSAFormValidators } from '@picsa/shared/modules/forms/validators';
import { IUploadResult, SupabaseUploadComponent } from '@picsa/shared/services/core/supabase';

import { DashboardMaterialModule } from '../../../material.module';

@Component({
  selector: 'dashboard-resource-create',
  standalone: true,
  imports: [CommonModule, DashboardMaterialModule, FormsModule, ReactiveFormsModule, SupabaseUploadComponent],
  templateUrl: './resource-create.component.html',
  styleUrls: ['./resource-create.component.scss'],
})
export class ResourceCreateComponent {
  constructor(private formBuilder: FormBuilder) {}

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

  public async handleUploadComplete(res: IUploadResult[]) {
    this.uploadedFile = res[0];
  }
}
