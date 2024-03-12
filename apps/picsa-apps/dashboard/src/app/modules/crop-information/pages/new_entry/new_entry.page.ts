import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';

import { DashboardMaterialModule } from '../../../../material.module';
import {
  CropProbabilityDashboardService,
  ICropInformationInsert,
  ICropInformationRow,
} from '../../crop-information.service';

@Component({
  selector: 'dashboard-new-entry',
  standalone: true,
  imports: [CommonModule, DashboardMaterialModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './new_entry.component.html',
  styleUrls: ['./new_entry.component.scss'],
})
export class NewEntryPageComponent implements OnInit {
  entryForm = this.formBuilder.nonNullable.group({
    id: new FormControl(), // populated by server or on edit
    crop: ['', Validators.required],
    variety: ['', Validators.required],
    water_lower: [0],
    water_upper: [0],
    length_lower: [0],
    length_upper: [0],
  });

  /** Utility method, retained to ensure rawValue corresponds to expected CaledarDataEntry type */
  private get formValue() {
    const entry: ICropInformationInsert = this.entryForm.getRawValue();
    return entry;
  }

  constructor(
    private service: CropProbabilityDashboardService,
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: PicsaNotificationService
  ) {
    this.service.ready();
  }

  ngOnInit(): void {
    this.service.ready();
    const { id } = this.route.snapshot.params;
    if (id) {
      this.loadEditableEntry(id);
    }
  }

  async submitForm() {
    const data = this.formValue;
    // remove `null` id generated if not editing
    if (data.id === null) delete data.id;
    try {
      await this.service.addCropProbability(data);
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
