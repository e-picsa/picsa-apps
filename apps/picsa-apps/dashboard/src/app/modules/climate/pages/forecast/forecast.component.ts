import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, Signal, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { RefreshSpinnerComponent } from '@picsa/components';
import { LOCALES_DATA_HASHMAP } from '@picsa/data';
import { FunctionResponses } from '@picsa/server-types';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { DashboardMaterialModule } from '../../../../material.module';
import { AuthRoleRequiredDirective } from '../../../auth';
import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { ClimateService } from '../../climate.service';
import { ForecastType, IForecastRow } from '../../types';
import { ForecastFormComponent, IForecastDialogData } from './forecast-form/forecast-form.component';
import { DashboardClimateMonthSelectComponent } from './month-select/month-select.component';

type IForecastDBAPIResponse = { data: FunctionResponses['Dashboard']['forecast-db']; error?: any };

type IForecastTab = {
  type: ForecastType;
  label: string;
  data: Signal<IForecastRow[]>;
  columns: (keyof IForecastRow)[];
};

@Component({
  selector: 'dashboard-climate-forecast',
  imports: [
    CommonModule,
    DashboardClimateMonthSelectComponent,
    RouterModule,
    PicsaDataTableComponent,
    DashboardMaterialModule,
    RefreshSpinnerComponent,
    AuthRoleRequiredDirective,
  ],
  templateUrl: './forecast.component.html',
  styleUrls: ['./forecast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClimateForecastPageComponent {
  public forecasts = this.db.liveSignal({ filter: { country_code: this.deploymentService.activeDeploymentCountry } });

  public dailyForecasts = computed(() => this.forecasts().filter((v) => v.forecast_type === 'daily'));
  public weeklyForecasts = computed(() => this.forecasts().filter((v) => v.forecast_type === 'weekly'));
  public downscaledForecasts = computed(() => this.forecasts().filter((v) => v.forecast_type === 'downscaled'));
  public seasonalForecasts = computed(() => this.forecasts().filter((v) => v.forecast_type === 'seasonal'));

  // Single source of truth for tabs
  public forecastTabs: IForecastTab[] = [
    {
      type: 'seasonal',
      label: 'Seasonal',
      data: this.seasonalForecasts,
      columns: ['created_at', 'location', 'language_code', 'storage_file'],
    },
    {
      type: 'downscaled',
      label: 'Downscaled',
      data: this.downscaledForecasts,
      columns: ['created_at', 'location', 'language_code', 'storage_file'],
    },
    {
      type: 'weekly',
      label: 'Weekly',
      data: this.weeklyForecasts,
      columns: ['created_at', 'label', 'storage_file'],
    },
    {
      type: 'daily',
      label: 'Daily',
      data: this.dailyForecasts,
      columns: ['created_at', 'label', 'storage_file'],
    },
  ];

  private activeForecastTabIndex = signal(0);

  public activeForecastType = computed(() => this.forecastTabs[this.activeForecastTabIndex()].type);

  public tableOptions = computed((): IDataTableOptions => {
    const { columns } = this.forecastTabs[this.activeForecastTabIndex()] as IForecastTab;
    return {
      displayColumns: columns,
      handleRowClick: (row: IForecastRow) => this.handleStorageClick(row),
      formatHeader: (v) => {
        if (v === 'language_code') return 'Language';
        return formatHeaderDefault(v);
      },
    };
  });

  public refreshPending = signal(false);

  public apiStartDate = signal(new Date());

  /** When querying data use name prefixes to limit search results, e.g. 202406* pattern match */
  private apiQueryPrefix = computed(() => this.apiStartDate().toISOString().replace(/-/g, '').substring(0, 6));

  private countryCode = computed(() => this.deploymentService.activeDeploymentCountry());

  /** Use combination of apiQuery and countryCode to avoid repeated data refresh on load */
  private apiQueryMemo = computed(() => this.countryCode() && `${this.countryCode()}/${this.apiQueryPrefix()}`);

  public activeDownloads = signal<Record<string, 'pending' | 'complete'>>({});

  public locales = LOCALES_DATA_HASHMAP;

  private get db() {
    return this.supabase.db.table('forecasts');
  }

  private dialog = inject(MatDialog);

  constructor(
    private service: ClimateService,
    private supabase: SupabaseService,
    private deploymentService: DeploymentDashboardService,
    private notificationService: PicsaNotificationService,
  ) {
    effect(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const memo = this.apiQueryMemo();
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

  public async handleStorageClick(row: IForecastRow) {
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

  public handleTabChange(index: number) {
    this.activeForecastTabIndex.set(index);
  }

  public async addForecast() {
    const data: IForecastDialogData = { country_code: this.countryCode(), forecast_type: this.activeForecastType() };
    const dialog = this.dialog.open(ForecastFormComponent, { data });

    dialog.afterClosed().subscribe((v) => {
      console.log('forecast dialog closed', v);
    });
  }

  private async loadDBData() {
    const { country_code } = this.deploymentService.activeDeployment();
    // Load data stored in supabase db if available. Otherwise load from api
    const { data, error } = await this.db
      .select<'*', IForecastRow>('*')
      .eq('country_code', country_code)
      .like('id', `${this.apiQueryPrefix()}%`);
    if (error) throw error;

    return data;
  }

  /** Invoke backend function that fetches forecasts from climate api and updates db */
  private async refreshAPIData() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const country_code = this.countryCode() as string;
    const query_prefix = this.apiQueryPrefix();

    const data = await this.supabase
      .invokeFunction<IForecastDBAPIResponse>('dashboard/forecast-db', {
        method: 'POST',
        body: { country_code, query_prefix },
      })
      .catch((err) => {
        console.error(err);
        this.notificationService.showErrorNotification('Forecast Update Failed. See console logs for details');
        return [];
      });

    const forecasts = data?.[country_code] || [];

    return forecasts;
  }

  private async downloadStorageFile(row: IForecastRow) {
    // TODO - invoke cloud function instead of direct
    this.activeDownloads.update((v) => ({ ...v, [row.id]: 'pending' }));
    const storagePath = await this.service.loadFromAPI.forecast_file(row);
    this.activeDownloads.update((v) => ({ ...v, [row.id]: 'complete' }));
    return storagePath;
  }
}
