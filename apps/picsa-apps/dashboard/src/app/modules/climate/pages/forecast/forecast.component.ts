import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { DashboardMaterialModule } from '../../../../material.module';
import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { ClimateService } from '../../climate.service';
import { DashboardClimateApiStatusComponent, IApiStatusOptions } from '../../components/api-status/api-status';
import { IAPICountryCode, IForecastRow } from '../../types';
import { DashboardClimateMonthSelectComponent } from './month-select/month-select.component';

interface IForecastTableRow extends IForecastRow {
  file_name: string;
}

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
    DashboardClimateApiStatusComponent,
    DashboardClimateMonthSelectComponent,
    RouterModule,
    PicsaDataTableComponent,
    DashboardMaterialModule,
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
  public apiStatusOptions: IApiStatusOptions = {
    events: { refresh: () => this.refreshAPIData() },
    showStatusCode: false,
  };

  public apiStartDate = signal(new Date());
  /** When querying data use name prefixes to limit search results, e.g. 202406* pattern match */
  private apiQueryPrefix = computed(() => this.apiStartDate().toISOString().replace(/-/g, '').substring(0, 6));

  public activeDownloads = signal<Record<string, 'pending' | 'complete'>>({});

  private get db() {
    return this.supabase.db.table('climate_forecasts');
  }

  constructor(
    private service: ClimateService,
    private supabase: SupabaseService,
    private deploymentService: DeploymentDashboardService
  ) {
    effect(async () => {
      // whenever deployment or start date set load db data and refresh from api
      const deployment = this.deploymentService.activeDeployment();
      const startDate = this.apiStartDate();
      if (deployment && startDate) {
        await this.service.ready();
        await this.loadDBData();
        await this.refreshAPIData();
      }
    });
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
  private async refreshAPIData() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { country_code } = this.deploymentService.activeDeployment()!;
    const apiData = await this.service.loadFromAPI.forecasts(country_code as IAPICountryCode, this.apiQueryPrefix());
    this.forecastData.set(this.toTableData(apiData));
  }

  private toTableData(data: IForecastRow[]): IForecastTableRow[] {
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
