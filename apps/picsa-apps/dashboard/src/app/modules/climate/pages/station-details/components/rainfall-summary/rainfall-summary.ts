import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, input, output } from '@angular/core';
import { IStationData } from '@picsa/models/src';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features/data-table';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { ClimateService } from '../../../../climate.service';
import { DashboardClimateApiStatusComponent, IApiStatusOptions } from '../../../../components/api-status/api-status';
import {
  IAnnualRainfallSummariesData,
  IAnnualRainfallSummariesMetadata,
  IClimateSummaryRainfallRow,
  IStationRow,
} from '../../../../types';
import { hackConvertAPIDataToLegacyFormat } from './rainfall-summary.utils';

interface IRainfallSummary {
  data: IAnnualRainfallSummariesData[];
  metadata: IAnnualRainfallSummariesMetadata;
}

@Component({
  selector: 'dashboard-climate-rainfall-summary',
  templateUrl: './rainfall-summary.html',
  imports: [DashboardClimateApiStatusComponent, PicsaDataTableComponent],
  styleUrl: './rainfall-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RainfallSummaryComponent {
  public summaryMetadata: IRainfallSummary['metadata'] = {};
  public summaryData: IStationData[] = [];

  public station = input.required<IStationRow>();

  public rainfallSummaryLoaded = output<IStationData[]>();

  constructor(
    private service: ClimateService,
    private cdr: ChangeDetectorRef,
    private supabase: SupabaseService,
  ) {
    effect(() => {
      const station = this.station();
      this.loadRainfallSummaries(station);
    });
  }

  public tableOptions: IDataTableOptions = {
    paginatorSizes: [25, 50],
  };

  public summaryReqOptions: IApiStatusOptions = {
    events: { refresh: () => this.refreshRainfallSummaries() },
    showStatusCode: true,
  };

  private get db() {
    return this.supabase.db.table('climate_summary_rainfall');
  }

  private async loadRainfallSummaries(station: IStationRow) {
    // Load data stored in supabase db if available. Otherwise load from api
    // TODO - nicer if could include db lookups as part of mapping doc
    const { data, error } = await this.db
      .select<'*', IClimateSummaryRainfallRow>('*')
      .eq('station_id', station.id)
      .single();
    if (data) {
      this.loadRainfallSummaryData(data);
    } else {
      await this.refreshRainfallSummaries();
    }
  }

  public async refreshRainfallSummaries() {
    const data = await this.service.loadFromAPI.rainfallSummaries(this.station());
    const summary = data?.[0];
    if (summary) {
      this.loadRainfallSummaryData(summary);
    }
  }

  private loadRainfallSummaryData(summary: IClimateSummaryRainfallRow) {
    console.log('load data', summary);
    this.tableOptions.exportFilename = `${this.station().id}.csv`;
    const { data, metadata } = summary;
    const legacyData = hackConvertAPIDataToLegacyFormat(data);
    this.summaryData = legacyData;
    this.summaryMetadata = metadata;
    this.rainfallSummaryLoaded.emit(legacyData);
    this.cdr.markForCheck();
  }
}
