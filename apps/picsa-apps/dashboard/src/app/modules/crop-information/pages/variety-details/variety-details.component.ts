import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PicsaFormsModule } from '@picsa/forms';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';

import { DashboardMaterialModule } from '../../../../material.module';
import { CropInformationService, ICropInformationInsert, ICropInformationRow } from '../../services';

@Component({
  selector: 'dashboard-crop-variety-details',
  standalone: true,
  imports: [CommonModule, DashboardMaterialModule, RouterModule, FormsModule, PicsaFormsModule, ReactiveFormsModule],
  templateUrl: './variety-details.component.html',
  styleUrl: './variety-details.component.scss',
})
export class CropVarietyDetailsComponent implements OnInit {
  entryForm = this.formBuilder.nonNullable.group({
    id: new FormControl(), // populated by server or on edit
    crop: ['', Validators.required],
    variety: ['', Validators.required],
    label: new FormControl<string>(''),

    // water_lower: [0],
    // water_upper: [0],
    // length_lower: [0],
    // length_upper: [0],
  });

  /** Utility method, retained to ensure rawValue corresponds to expected CaledarDataEntry type */
  private get formValue() {
    const entry: ICropInformationInsert = this.entryForm.getRawValue();
    return entry;
  }

  constructor(
    private service: CropInformationService,
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: PicsaNotificationService
  ) {}

  async ngOnInit() {
    await this.service.ready();
    const { id } = this.route.snapshot.params;
    if (id === 'new') return;
    if (id) {
      await this.loadEditableEntry(id);
      // avoid crop type or variety change after entry created as wil change id
      this.entryForm.controls.crop.disable();
      this.entryForm.controls.variety.disable();
    }
  }

  async submitForm() {
    try {
      if (this.formValue.id) {
        await this.service.updateCropProbability(this.formValue);
      } else {
        // remove null id when adding crop probability
        const { id, ...data } = this.formValue;
        await this.service.addCropProbability(data);
      }
      // navigate back after successful addition
      this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
    } catch (error: any) {
      this.notificationService.showUserNotification({ matIcon: 'error', message: error.message });
    }
  }

  /** Load an existing db record for editing */
  private async loadEditableEntry(id: string) {
    const { data, error } = await this.service.table.select<'*', ICropInformationRow>('*').eq('id', id).single();
    if (data) {
      this.entryForm.patchValue(data);
    }
    if (error) {
      this.notificationService.showUserNotification({ matIcon: 'error', message: error.message });
      this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
    }
  }
}
