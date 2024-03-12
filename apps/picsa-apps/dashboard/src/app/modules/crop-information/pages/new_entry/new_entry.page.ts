import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { DashboardMaterialModule } from '../../../../material.module';
import { CropProbabilityDashboardService, ICropInformationInsert } from '../../crop-information.service';

@Component({
  selector: 'dashboard-new-entry',
  standalone: true,
  imports: [CommonModule, DashboardMaterialModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './new_entry.component.html',
  styleUrls: ['./new_entry.component.scss'],
})
export class NewEntryPageComponent implements OnInit {
  entryForm = this.formBuilder.nonNullable.group({
    crop: ['', Validators.required],
    variety: ['', Validators.required],
    water_lower: [0],
    water_upper: [0],
    length_lower: [0],
    length_upper: [0],
  });
  ActionFeedbackMessage: string;

  /** Utility method, retained to ensure rawValue corresponds to expected CaledarDataEntry type */
  private get formValue() {
    const entry: ICropInformationInsert = this.entryForm.getRawValue();
    return entry;
  }

  constructor(
    private service: CropProbabilityDashboardService,
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.service.ready();
  }

  ngOnInit(): void {
    this.service.ready();
  }
  submitForm() {
    this.service
      .addCropProbability(this.formValue)
      .then((data) => {
        if (data === 'Added successfully') {
          this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
        }
      })
      .catch((error) => {
        console.error('Error adding new entry:', error);
        this.ActionFeedbackMessage = 'Error adding new entry';
      });
  }
}
