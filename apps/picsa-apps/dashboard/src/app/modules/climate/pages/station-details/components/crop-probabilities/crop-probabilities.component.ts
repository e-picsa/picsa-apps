import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { DashboardMaterialModule } from 'apps/picsa-apps/dashboard/src/app/material.module';

import { ClimateService } from '../../../../climate.service';
import { DashboardClimateApiStatusComponent, IApiStatusOptions } from '../../../../components/api-status/api-status';
import { IClimateSummaryProbabilities, ICropSuccessEntry, IStationRow } from '../../../../types';
import { DashboardClimateDataGridComponent } from './data-grid/data-grid/data-grid.component';

interface IProbabilityEntry {
  plant_day: number;
  plant_length: number;
  total_rain: number;
  probability: number;
}

@Component({
  selector: 'dashboard-climate-crop-probabilities',
  imports: [
    CommonModule,
    DashboardClimateDataGridComponent,
    DashboardClimateApiStatusComponent,
    DashboardMaterialModule,
    PicsaDataTableComponent,
  ],
  templateUrl: './crop-probabilities.component.html',
  styleUrl: './crop-probabilities.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropProbabilitiesComponent {
  public station = input.required<IStationRow>();

  public probabilityReqOptions: IApiStatusOptions = {
    events: { refresh: () => this.refreshData() },
    showStatusCode: true,
  };

  public plantDateRange = computed(() => {
    const data = this.allProbabilities();
    return [data[0]?.plant_day, data[data.length - 1]?.plant_day];
  });

  public selectedPlantDate = signal(0);

  public tableData = computed(() => {
    const allProbabilities = this.allProbabilities();
    const selectedPlantDate = this.selectedPlantDate();
    return allProbabilities.filter((v) => v.plant_day === selectedPlantDate);
  });

  public tableOptions: IDataTableOptions = {
    search: false,
  };

  private allProbabilities = signal<IProbabilityEntry[]>([]);

  constructor(
    private service: ClimateService,
    private supabase: SupabaseService,
  ) {
    effect(() => {
      const station = this.station();
      this.loadCropProbabilities(station);
    });
    effect(() => {
      const data = this.allProbabilities();
      this.selectedPlantDate.set(data[0]?.plant_day);
    });
  }

  public formatPlantDateLabel(v: number) {
    return `${v}`;
  }

  private get db() {
    return this.supabase.db.table('climate_summary_probabilities');
  }

  private async loadCropProbabilities(station: IStationRow) {
    // Load data stored in supabase db if available. Otherwise load from api
    // TODO - nicer if could include db lookups as part of mapping doc
    const { data, error } = await this.db
      .select<'*', IClimateSummaryProbabilities['Row']>('*')
      .eq('station_id', station.id)
      .single();
    if (data) {
      this.processData(data.data as ICropSuccessEntry[]);
    } else {
      await this.refreshData();
    }
  }

  private async refreshData() {
    const data = await this.service.loadFromAPI.cropProbabilities(this.station());
    if (data) {
      this.processData(data.data as ICropSuccessEntry[]);
    }
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
    this.allProbabilities.set(allProbabilities);
  }
}
