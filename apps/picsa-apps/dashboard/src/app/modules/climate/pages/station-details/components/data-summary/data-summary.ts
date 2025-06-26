/* eslint-disable @nx/enforce-module-boundaries */
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features/data-table';
import { DashboardMaterialModule } from 'apps/picsa-apps/dashboard/src/app/material.module';

import { IAnnualRainfallSummariesData, IClimateStationData, IStationRow } from '../../../../types';
import { hackConvertAPIDataToLegacyFormat } from './data-summary.utils';

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

  public tableData = computed(() =>
    hackConvertAPIDataToLegacyFormat(this.data()?.annual_rainfall_data as IAnnualRainfallSummariesData[]),
  );

  public tableOptions = computed<IDataTableOptions>(() => ({
    paginatorSizes: [25, 50],
    exportFilename: `${this.station().id}.csv`,
  }));
}
