import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder,FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { DashboardMaterialModule } from '../../../../material.module';
import { CropProbabilityDashboardService } from '../../crop-information.service';

@Component({
  selector: 'dashboard-new-entry',
  standalone: true,
  imports: [CommonModule, DashboardMaterialModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './new_entry.component.html',
  styleUrls: ['./new_entry.component.scss'],
})
export class NewEntryPageComponent implements OnInit {
  entryForm = this.formBuilder.group({
    crop: ['', Validators.required],
    variety: ['', Validators.required],
    water_lower: [0],
    water_upper: [0],
    length_lower: [0],
    length_upper: [0],
  });
  ActionFeedbackMessage: string;

  constructor(private service: CropProbabilityDashboardService, private formBuilder: FormBuilder) {
    this.service.ready();
  }

  ngOnInit(): void {
    this.service.ready();
  }
  submitForm() {
    const formData = this.entryForm.value;
    this.service
      .addCropProbability(formData)
      .then((data) => {
        if (data === 'Added successfully') {
          this.ActionFeedbackMessage = 'Entry added successfully';
        }
      })
      .catch((error) => {
        console.error('Error adding new entry:', error);
        this.ActionFeedbackMessage = 'Error adding new entry';
      });
  }
}
