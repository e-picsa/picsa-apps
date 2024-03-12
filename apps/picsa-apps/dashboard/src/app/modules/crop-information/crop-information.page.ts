import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PicsaDataTableComponent } from '@picsa/shared/features';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';

import { DashboardMaterialModule } from '../../material.module';
import { CropProbabilityDashboardService, ICropInformationRow } from './crop-information.service';

@Component({
  selector: 'dashboard-resources-page',
  standalone: true,
  imports: [CommonModule, DashboardMaterialModule, PicsaDataTableComponent, RouterModule],
  templateUrl: '../crop-information/crop-information.component.html',
  styleUrls: ['../crop-information/crop-information.component.scss'],
})
export class CropInformationPageComponent implements OnInit {
  constructor(
    public service: CropProbabilityDashboardService,
    private notificationService: PicsaNotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  displayedColumns: string[] = [
    'crop',
    'variety',
    'water_lower',
    'water_upper',
    'length_lower',
    'length_upper',
    'label',
  ];

  tableOptions = {
    displayColumns: this.displayedColumns,
    handleRowClick: (row: ICropInformationRow) => {
      this.router.navigate([row.id], { relativeTo: this.route });
    },
  };

  async ngOnInit() {
    this.service.ready();
    this.refreshCropInformation();
  }

  refreshCropInformation() {
    this.service.listCropProbabilities().catch((error) => {
      this.notificationService.showUserNotification({
        matIcon: 'error',
        message: 'Error fetching crop probabilities:' + error.message,
      });
    });
  }
}
