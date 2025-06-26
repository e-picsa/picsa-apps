/* eslint-disable @nx/enforce-module-boundaries */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { DashboardMaterialModule } from 'apps/picsa-apps/dashboard/src/app/material.module';

import { IClimateStationData, ICropSuccessEntry } from '../../../../types';
import { DashboardClimateDataGridComponent } from './data-grid/data-grid/data-grid.component';

interface IProbabilityEntry {
  plant_day: number;
  plant_length: number;
  total_rain: number;
  probability: number;
}

@Component({
  selector: 'dashboard-climate-crop-probabilities',
  imports: [CommonModule, DashboardClimateDataGridComponent, DashboardMaterialModule, PicsaDataTableComponent],
  templateUrl: './crop-probabilities.component.html',
  styleUrl: './crop-probabilities.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropProbabilitiesComponent {
  public plantDateRange = computed(() => {
    const data = this.allProbabilities();
    return [data[0]?.plant_day, data[data.length - 1]?.plant_day];
  });

  public data = input<IClimateStationData['Row']['crop_probability_data']>();

  private allProbabilities = computed(() => this.processData((this.data() || []) as ICropSuccessEntry[]));

  public selectedPlantDate = signal(0);

  public tableData = computed(() => {
    const allProbabilities = this.allProbabilities();
    const selectedPlantDate = this.selectedPlantDate();
    return allProbabilities.filter((v) => v.plant_day === selectedPlantDate);
  });

  public tableOptions: IDataTableOptions = {
    search: false,
  };

  constructor() {
    effect(() => {
      const data = this.allProbabilities();
      this.selectedPlantDate.set(data[0]?.plant_day);
    });
  }

  public formatPlantDateLabel(v: number) {
    return `${v}`;
  }

  /**
   * Convert api data to summary format, using only `no_start` probabilities (rounded)
   * and dropping additional columns
   */
  private processData(data: ICropSuccessEntry[]) {
    const allProbabilities: IProbabilityEntry[] = data.map(
      ({ plant_day, plant_length, prop_success_no_start, total_rain }) => ({
        plant_day,
        plant_length,
        total_rain,
        probability: Math.round(prop_success_no_start * 100) / 100,
      }),
    );
    return allProbabilities;
  }
}
