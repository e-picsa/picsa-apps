import { computed, effect, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { ngRouterMergedSnapshot$ } from '@picsa/utils/angular';
import { map } from 'rxjs';

import { DeploymentDashboardService } from '../deployment/deployment.service';
import { IDeploymentRow } from '../deployment/types';
import { ApiMapping, IAPICountryCode } from './climate-api.mapping';
import { ClimateApiService } from './climate-api.service';
import { IStationRow } from './types';

@Injectable({ providedIn: 'root' })
export class ClimateService extends PicsaAsyncService {
  public apiStatus: number;
  public stations = signal<IStationRow[]>([]);

  /** Lookup active station from stationId param and db stations list*/
  public activeStation = computed<IStationRow>(() => {
    const stations = this.stations();
    const activeStationId = this.activeStationId();
    if (stations.length > 0) {
      const station = stations.find((station) => station.station_id === activeStationId);
      if (station) return station;
      else {
        this.router.navigate(['climate', 'station']);
        this.notificationService.showErrorNotification(`[Climate Station] data not found: ${activeStationId}`);
      }
    }
    // UI components aren't rendered unless station defined so can safely ignore this return type
    return null as any;
  });
  /** Country code used for api requests */
  public apiCountryCode: IAPICountryCode;

  /** Trigger API request that includes mapping response to local database */
  public loadFromAPI = ApiMapping(
    this.api,
    this,
    this.supabaseService.db,
    this.supabaseService.storage,
    this.deploymentSevice.activeDeployment() as IDeploymentRow
  );

  // Create a signal to represent current stationId as defined by route params
  private activeStationId = toSignal(
    ngRouterMergedSnapshot$(this.router).pipe(map(({ params }) => decodeURIComponent(params.stationId)))
  );

  constructor(
    private supabaseService: SupabaseService,
    private api: ClimateApiService,
    private router: Router,
    private deploymentSevice: DeploymentDashboardService,
    private notificationService: PicsaNotificationService
  ) {
    super();
    this.ready();
    // Update list of available stations for deployment country code and station id on change
    effect(async () => {
      const deployment = this.deploymentSevice.activeDeployment();
      if (deployment) {
        await this.loadData(deployment);
      }
    });
  }

  public override async init() {
    await this.supabaseService.ready();
  }

  private async loadData(deployment: IDeploymentRow) {
    // allow configuration override for country_code
    const configuration = deployment.configuration as any;
    const targetCode = configuration.climate_country_code || deployment.country_code;
    // refresh list of stations on deployment country code change (or if forced update)
    if (targetCode !== this.apiCountryCode) {
      this.apiCountryCode = targetCode;
      await this.ready();
      await this.listStations(targetCode);
    }
  }

  private async listStations(country_code: string) {
    // TODO - when running should refresh from server as cron task
    const { data, error } = await this.supabaseService.db
      .table('climate_stations')
      .select<'*', IStationRow>('*')
      .eq('country_code', country_code);
    if (error) {
      throw error;
    }
    if (data?.length > 0) {
      this.stations.set(data);
    } else {
      // NOTE - api will also update station signal
      await this.loadFromAPI.station(country_code);
    }
  }
}
