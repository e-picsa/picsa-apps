import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

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
  station_name: string;
  water_lower: number;
  water_upper: number;
  length_lower: number;
  length_upper: number;
  station_notes: string[];
  ActionFeedbackMessage: string;
  constructor(private service: CropProbabilityDashboardService, private router: Router) {
    this.service.ready();
  }
  ngOnInit(): void {
    this.service.ready();
  }
  submitForm() {
    const data = {
      station_name: this.station_name,
      water_lower: this.water_lower,
      water_upper: this.water_upper,
      length_lower: this.length_lower,
      length_upper: this.length_upper,
      station_notes: this.station_notes,
    };
    this.service
      .addCropProbability(data)
      .then((data) => {
        if (data === 'Added successfully') {
          this.ActionFeedbackMessage = 'Added successfully';
        }
      })
      .catch((error) => {
        console.error('Error adding translation:', error);
        this.ActionFeedbackMessage = 'Failed to add a translation.';
      });
  }
  routeBack() {
    this.router.navigate(['/crop']);
  }
}
