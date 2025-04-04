import { ChangeDetectionStrategy, Component, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';

import { DashboardMaterialModule } from '../../../../material.module';
import { CropInformationService, ICropDataMerged } from '../../services';

const displayColumns: (keyof ITableDataRow)[] = [
  'crop',
  'variety',
  'maturity_period',
  'days_lower',
  'days_upper',
  'downscaled_locations',
];
interface ITableDataRow extends ICropDataMerged {
  downscaled_locations: number;
}

@Component({
  selector: 'dashboard-crop-variety',
  imports: [DashboardMaterialModule, PicsaDataTableComponent, RouterModule],
  templateUrl: './variety.component.html',
  styleUrl: './variety.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropVarietyComponent implements OnInit {
  // populate additional column to track total number of downscaled locations data available for
  public tableData = computed(() =>
    this.service.cropDataMerged().map((v) => {
      const tableRow: ITableDataRow = { ...v, downscaled_locations: v.downscaled.length };
      return tableRow;
    })
  );

  public tableOptions: IDataTableOptions = {
    displayColumns,
    handleRowClick: (row: ICropDataMerged) => {
      this.router.navigate(['./', row.id], { relativeTo: this.route });
    },
  };

  constructor(
    public service: CropInformationService,
    private notificationService: PicsaNotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.service.ready();
  }
}
