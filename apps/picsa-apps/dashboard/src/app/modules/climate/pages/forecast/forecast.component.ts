import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { RefreshSpinnerComponent } from '@picsa/components/refresh-spinner/refresh-spinner.component';
import { LOCALES_DATA_HASHMAP } from '@picsa/data';
import { FunctionResponses } from '@picsa/server-types';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { DashboardMaterialModule } from '../../../../material.module';
import { AuthRoleRequiredDirective } from '../../../auth';
import { DashboardAuthService } from '../../../auth/services/auth.service';
import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { ClimateService } from '../../climate.service';
import { ForecastType, IForecastRow } from '../../types';
import { ForecastFormComponent, IForecastDialogData } from './forecast-form/forecast-form.component';
import { DashboardClimateForecastOverviewComponent } from './forecast-overview/forecast-overview.component';
import { DashboardClimateMonthSelectComponent } from './month-select/month-select.component';

type IForecastDBAPIResponse = { data: FunctionResponses['Dashboard']['forecast-db']; error?: any };

type ForecastFilter = 'all' | ForecastType;

@Component({
  selector: 'dashboard-climate-forecast',
  imports: [
    CommonModule,
    DashboardClimateMonthSelectComponent,
    DashboardClimateForecastOverviewComponent,
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
  private service = inject(ClimateService);
  private supabase = inject(SupabaseService);
  private deploymentService = inject(DeploymentDashboardService);
  private authService = inject(DashboardAuthService);
  private notificationService = inject(PicsaNotificationService);

  public canEdit = computed(() => this.authService.hasRole('climate.editor'));

  public forecasts = this.db.liveSignal({
    filter: {
      country_code: this.deploymentService.activeDeploymentCountry,
    },
    orderBy: { column: 'created_at', ascending: false },
  });

  public activeFilter = signal<ForecastFilter>('all');

  public filterOptions: { value: ForecastFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'seasonal', label: 'Seasonal' },
    { value: 'downscaled', label: 'Downscaled' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'daily', label: 'Daily' },
  ];

  private columnsByFilter: Record<ForecastFilter, (keyof IForecastRow)[]> = {
    all: ['created_at', 'forecast_type', 'label', 'storage_file'],
    seasonal: ['created_at', 'label', 'language_code', 'storage_file'],
    downscaled: ['created_at', 'label', 'downscaled_location', 'language_code', 'storage_file'],
    weekly: ['created_at', 'label', 'storage_file'],
    daily: ['created_at', 'label', 'storage_file'],
  };

  /** Rows for the selected filter, already scoped to the selected month */
  public filteredForecasts = computed(() => {
    const rows = this.monthForecasts();
    const filter = this.activeFilter();
    return filter === 'all' ? rows : rows.filter((v) => v.forecast_type === filter);
  });

  /** Rows for the currently selected month (ids carry a YYYYMMDD prefix) */
  private monthForecasts = computed(() => {
    const prefix = this.apiQueryPrefix();
    return this.forecasts().filter((v) => v.id.startsWith(prefix));
  });

  public tableOptions = computed((): IDataTableOptions => {
    return {
      displayColumns: this.columnsByFilter[this.activeFilter()],
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

  constructor() {
    effect(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const memo = this.apiQueryMemo();
      void this.initForecastData().catch((err) => console.error('[forecast] init failed', err));
    });
    effect(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const memo = this.apiQueryMemo();
      if (this.canEdit()) {
        void this.refreshForecastOnReady().catch((err) => console.error('[forecast] refresh failed', err));
      }
    });
  }

  private async initForecastData() {
    await this.service.ready();
    await this.loadDBData();
  }

  private async refreshForecastOnReady() {
    await this.service.ready();
    await this.handleRefreshClick();
  }

  public async handleRefreshClick() {
    if (!this.canEdit()) return;
    this.refreshPending.set(true);
    await this.refreshAPIData();
    this.refreshPending.set(false);
  }

  public async handleStorageClick(row: IForecastRow) {
    let { storage_file } = row;
    // handle download if storage file doesn't exist or hasn't been downloaded
    if (!storage_file && this.activeDownloads()[row.id] !== 'complete') {
      if (!this.canEdit()) return;
      storage_file = await this.downloadStorageFile(row);
    }
    if (!storage_file) return;
    // handle open
    const [bucket, ...path] = (storage_file as string).split('/');
    const publicLink = this.supabase.storage.getPublicLink(bucket, path.join('/'));
    open(publicLink, '_blank');
  }

  public async addForecast() {
    // Manual adds are restricted to seasonal/downscaled - daily and weekly
    // rows are owned by the automated climate api sync, never individuals
    if (!this.canEdit() || !this.canAddForecast()) return;
    const data: IForecastDialogData = {
      country_code: this.countryCode(),
      forecast_type: this.activeFilter() as ForecastType,
    };
    this.dialog.open(ForecastFormComponent, { data });
    // dialog will handle save, data will auto-reload from liveSignal subscription
  }

  /** Manual forecast creation is limited to seasonal/downscaled types */
  public canAddForecast = computed(() => this.activeFilter() === 'seasonal' || this.activeFilter() === 'downscaled');

  private async loadDBData() {
    const country_code = this.deploymentService.activeDeployment()?.country_code;
    if (!country_code) return [];
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
