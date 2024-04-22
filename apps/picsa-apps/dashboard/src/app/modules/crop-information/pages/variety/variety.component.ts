import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PicsaDataTableComponent } from '@picsa/shared/features';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';

import { DashboardMaterialModule } from '../../../../material.module';
import { CropInformationService, ICropInformationRow } from '../../services';

@Component({
  selector: 'dashboard-crop-variety',
  standalone: true,
  imports: [CommonModule, DashboardMaterialModule, PicsaDataTableComponent, RouterModule],
  templateUrl: './variety.component.html',
  styleUrl: './variety.component.scss',
})
export class CropVarietyComponent implements OnInit {
  constructor(
    public service: CropInformationService,
    private notificationService: PicsaNotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  displayedColumns: (keyof ICropInformationRow)[] = ['crop', 'variety', 'label'];

  tableOptions = {
    displayColumns: this.displayedColumns,
    handleRowClick: (row: ICropInformationRow) => {
      this.router.navigate(['./', row.id], { relativeTo: this.route });
    },
  };

  async ngOnInit() {
    this.service.ready();
    this.refreshCropInformation();
  }

  refreshCropInformation() {
    this.service.list().catch((error) => {
      this.notificationService.showUserNotification({
        matIcon: 'error',
        message: 'Error fetching crop probabilities:' + error.message,
      });
    });
  }
}
