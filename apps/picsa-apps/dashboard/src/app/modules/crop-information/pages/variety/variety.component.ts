import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';

import { DashboardMaterialModule } from '../../../../material.module';
import { CropInformationService, ICropInformationRow } from '../../services';

@Component({
  selector: 'dashboard-crop-variety',
  imports: [DashboardMaterialModule, PicsaDataTableComponent, RouterModule],
  templateUrl: './variety.component.html',
  styleUrl: './variety.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropVarietyComponent implements OnInit {
  constructor(
    public service: CropInformationService,
    private notificationService: PicsaNotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  displayedColumns: (keyof ICropInformationRow)[] = ['crop', 'variety', 'label'];

  tableOptions: IDataTableOptions = {
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
      throw new Error('Error fetching crop probabilities:' + error.message);
    });
  }
}
