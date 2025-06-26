/* eslint-disable @nx/enforce-module-boundaries */
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features/data-table';
import { DashboardMaterialModule } from 'apps/picsa-apps/dashboard/src/app/material.module';

import { hackConvertStationDataForDisplay } from '../../../../climate.utils';
import { IClimateStationData, IStationRow } from '../../../../types';

@Component({
  selector: 'dashboard-climate-data-summary',
  templateUrl: './data-summary.html',
  imports: [PicsaDataTableComponent, DashboardMaterialModule],
  styleUrl: './data-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataSummaryComponent {
  public station = input.required<IStationRow>();

  public data = input<IClimateStationData['Row'] | null>();

  public tableData = computed(() => {
    const data = this.data();
    if (data) {
      return hackConvertStationDataForDisplay(data);
    }
    return [];
  });

  public tableOptions = computed<IDataTableOptions>(() => ({
    paginatorSizes: [25, 50],
    exportFilename: `${this.station().id}.csv`,
  }));
}
