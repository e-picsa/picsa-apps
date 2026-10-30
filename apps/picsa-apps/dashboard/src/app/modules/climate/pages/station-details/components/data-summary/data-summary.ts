import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features/data-table';

import { DashboardMaterialModule } from '../../../../../../material.module';
import { extractStationGenerationMetadata, hackConvertStationDataForDisplay } from '../../../../climate.utils';
import { IClimateStationData, IStationRow } from '../../../../types';

@Component({
  selector: 'dashboard-climate-data-summary',
  templateUrl: './data-summary.html',
  imports: [CommonModule, DatePipe, MatTooltipModule, PicsaDataTableComponent, DashboardMaterialModule],
  styleUrl: './data-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataSummaryComponent {
  public station = input.required<IStationRow>();

  public data = input<IClimateStationData['Row'] | null>();

  public generationMetadata = computed(() => {
    const data = this.data();
    if (!data) return undefined;
    const { generation_timestamp, generation_id } = extractStationGenerationMetadata(data);
    return {
      generation_timestamp,
      generation_id,
      updated_at: data.updated_at,
    };
  });

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
