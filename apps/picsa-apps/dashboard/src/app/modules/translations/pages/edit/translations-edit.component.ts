import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { Database } from '@picsa/server-types';
import { PICSAFormValidators } from '@picsa/shared/modules/forms/validators';
//import {
//   IUploadResult,
//   SupabaseStoragePickerDirective,
//   SupabaseUploadComponent,
// } from '@picsa/shared/services/core/supabase';
// import { IStorageEntry } from '@picsa/shared/services/core/supabase/services/supabase-storage.service';

// import { DashboardMaterialModule } from '../../../../material.module';
// import { DashboardResourcesStorageLinkComponent } from '../../components/storage-link/storage-link.component';
// import { ResourcesDashboardService } from '../../translations.service';

// type IResourceEntry = Database['public']['Tables']['resources']['Row'];

@Component({
  selector: 'dashboard-resource-create',
  standalone: true,
  imports: [
    CommonModule,
    // DashboardMaterialModule,
    // DashboardResourcesStorageLinkComponent,
    // FormsModule,
    // ReactiveFormsModule,
    // SupabaseStoragePickerDirective,
    // SupabaseUploadComponent,
  ],
  templateUrl: './translations-edit.component.html',
  styleUrls: ['./translations-edit.component.scss'],
})
export class TranslationsEditComponent {
  constructor(
    // private service: ResourcesDashboardService,
    private route: ActivatedRoute
  ) {}


  

  


}
