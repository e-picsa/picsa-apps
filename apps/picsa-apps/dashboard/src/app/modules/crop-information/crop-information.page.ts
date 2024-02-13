import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { DashboardMaterialModule } from '../../material.module';
import { CropProbabilityDashboardService } from './crop-information.service';

@Component({
  selector: 'dashboard-resources-page',
  standalone: true,
  imports: [CommonModule, DashboardMaterialModule],
  templateUrl: '../crop-information/crop-information.component.html',
  styleUrls: ['../crop-information/crop-information.component.scss'],
})
export class CropInformationPageComponent implements OnInit {
  constructor(public service: CropProbabilityDashboardService, private router: Router) {}

  displayedColumns: string[] = [
    'station_name',
    'water_lower',
    'water_upper',
    'length_lower',
    'length_upper',
    'station_notes',
  ];

  ngOnInit(): void {
    this.service.ready();
    this.refreshCropInformation();
  }

  refreshCropInformation() {
    this.service.listCropProbabilities().catch((error) => {
      console.error('Error fetching crop probabilities:', error);
    });
  }

  navigateToEntryPage(){
    this.router.navigate(['/crop-probability/entry'])
  }
}
