import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RefreshSpinnerComponent } from '@picsa/components';
import { FunctionResponses } from '@picsa/server-types';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';

import { DashboardMaterialModule } from '../../../../material.module';
import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { ClimateService } from '../../climate.service';
import { IForecastRow } from '../../types';
import { DashboardClimateMonthSelectComponent } from './month-select/month-select.component';

interface IForecastTableRow extends IForecastRow {
  file_name: string;
}

type IForecastDBAPIResponse = { data: FunctionResponses['Dashboard']['forecast-db']; error?: any };

const DISPLAY_COLUMNS: (keyof IForecastTableRow)[] = [
  'country_code',
  'forecast_type',
  'location',
  'file_name',
  'storage_file',
];

@Component({
  selector: 'dashboard-climate-forecast',
  imports: [
    CommonModule,
    DashboardClimateMonthSelectComponent,
    RouterModule,
    PicsaDataTableComponent,
    DashboardMaterialModule,
    RefreshSpinnerComponent,
  ],
  templateUrl: './forecast.component.html',
  styleUrls: ['./forecast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClimateForecastPageComponent {
  public forecastData = signal<IForecastTableRow[]>([]);

  public tableOptions: IDataTableOptions = {
    displayColumns: DISPLAY_COLUMNS,
    handleRowClick: (row: IForecastTableRow) => this.handleStorageClick(row),
  };

  public refreshPending = signal(false);

  public apiStartDate = signal(new Date());

  /** When querying data use name prefixes to limit search results, e.g. 202406* pattern match */
  private apiQueryPrefix = computed(() => this.apiStartDate().toISOString().replace(/-/g, '').substring(0, 6));

  private countryCode = computed(() => this.deploymentService.activeDeployment()?.country_code);

  /** Use combination of apiQuery and countryCode to avoid repeated data refresh on load */
  private apiQueryMemo = computed(() => this.countryCode() && `${this.countryCode()}/${this.apiQueryPrefix()}`);

  public activeDownloads = signal<Record<string, 'pending' | 'complete'>>({});

  private get db() {
    return this.supabase.db.table('forecasts');
  }

  constructor(
    private service: ClimateService,
    private supabase: SupabaseService,
    private deploymentService: DeploymentDashboardService,
    private notificationService: PicsaNotificationService
  ) {
    effect(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const memo = this.apiQueryMemo();
      this.forecastData.set([]);
      await this.service.ready();
      await this.loadDBData();
      await this.handleRefreshClick();
    });
  }

  public async handleRefreshClick() {
    this.refreshPending.set(true);
    await this.refreshAPIData();
    this.refreshPending.set(false);
  }

  public async handleStorageClick(row: IForecastTableRow) {
    let { storage_file } = row;
    // handle download if storage file doesn't exist or hasn't been downloaded
    if (!storage_file && this.activeDownloads[row.id] !== 'complete') {
      storage_file = await this.downloadStorageFile(row);
    }
    // handle open
    const [bucket, ...path] = (storage_file as string).split('/');
    const publicLink = this.supabase.storage.getPublicLink(bucket, path.join('/'));
    open(publicLink, '_blank');
  }

  private async loadDBData() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { country_code } = this.deploymentService.activeDeployment()!;
    // Load data stored in supabase db if available. Otherwise load from api
    const { data, error } = await this.db
      .select<'*', IForecastRow>('*')
      .eq('country_code', country_code)
      .like('id', `${this.apiQueryPrefix()}%`);
    if (error) throw error;
    if (data?.length > 0) {
      this.forecastData.set(this.toTableData(data));
    }
    return data;
  }

  /** Invoke backend function that fetches forecasts from climate api and updates db */
  private async refreshAPIData() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const country_code = this.countryCode() as string;
    const query_prefix = this.apiQueryPrefix();

    const { data, error } = await this.supabase.functions.invoke<IForecastDBAPIResponse>('dashboard/forecast-db', {
      method: 'POST',
      body: { country_code, query_prefix },
    });

    // Errors thrown from functions in JS client need to wait for message
    // https://github.com/supabase/functions-js/issues/45
    if (error && error instanceof FunctionsHttpError) {
      const errorMessage = await error.context.json();
      console.error('refreshAPIData', JSON.parse(errorMessage));
      this.notificationService.showErrorNotification('Forecast Update Failed. See console logs for details');
      return [];
    }
    const forecasts = data?.[country_code] || [];

    this.forecastData.update((v) => ([] as IForecastTableRow[]).concat(this.toTableData(forecasts), v));
    console.log('[Api Data Updated]', { country_code, data, forecasts });

    return forecasts;
  }

  private toTableData(data: IForecastRow[] = []): IForecastTableRow[] {
    return data
      .map((el) => {
        // compute file_name column from storage file path
        const file_name = el.id.split('/').pop() || '';
        return { ...el, file_name };
      })
      .sort((a, b) => (b.id > a.id ? 1 : -1));
  }

  private async downloadStorageFile(row: IForecastRow) {
    this.activeDownloads.update((v) => ({ ...v, [row.id]: 'pending' }));
    const storagePath = await this.service.loadFromAPI.forecast_file(row);
    this.activeDownloads.update((v) => ({ ...v, [row.id]: 'complete' }));
    return storagePath;
  }
}
