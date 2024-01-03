import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
 import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
// eslint-disable-next-line @nx/enforce-module-boundaries
 import type { Database } from '@picsa/server-types';
 import { PICSAFormValidators } from '@picsa/shared/modules/forms/validators';

 import { DashboardMaterialModule } from '../../../../material.module';
// import { DashboardResourcesStorageLinkComponent } from '../../components/storage-link/storage-link.component';
import { TranslationDashboardService } from '../../translations.service';

// type IResourceEntry = Database['public']['Tables']['resources']['Row'];

@Component({
  selector: 'dashboard-translations-edit',
  standalone: true,
  imports: [
    CommonModule,
    DashboardMaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './translations-edit.component.html',
  styleUrls: ['./translations-edit.component.scss'],
})
export class TranslationsEditComponent {
  constructor(
    private service: TranslationDashboardService,
    private route: ActivatedRoute
  ) {}

}
