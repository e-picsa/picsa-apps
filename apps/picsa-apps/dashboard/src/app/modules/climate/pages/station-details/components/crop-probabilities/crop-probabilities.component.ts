import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, input } from '@angular/core';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { ClimateService } from '../../../../climate.service';
import { DashboardClimateApiStatusComponent, IApiStatusOptions } from '../../../../components/api-status/api-status';
import { IClimateSummaryProbabilities, IStationRow } from '../../../../types';

@Component({
  selector: 'dashboard-climate-crop-probabilities',
  imports: [CommonModule, DashboardClimateApiStatusComponent],
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

  constructor(
    private service: ClimateService,
    private supabase: SupabaseService,
  ) {
    effect(() => {
      const station = this.station();
      this.loadCropProbabilities(station);
    });
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
      this.processData(data);
    } else {
      await this.refreshData();
    }
  }

  private async refreshData() {
    const data = await this.service.loadFromAPI.cropProbabilities(this.station());
    if (data) {
      // TODO - process data as required
      console.log('crop probability data loaded', data);
    }
  }

  private processData(data) {
    console.log('processing probability data', data);
  }
}
