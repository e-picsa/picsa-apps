import { effect, Injectable, signal } from '@angular/core';
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
  public activeStation: IStationRow;
  /** Country code used for api requests */
  public apiCountryCode: IAPICountryCode;

  /** Trigger API request that includes mapping response to local database */
  public loadFromAPI = ApiMapping(
    this.api,
    this.supabaseService.db,
    this.supabaseService.storage,
    this.deploymentSevice.activeDeployment() as IDeploymentRow
  );

  // Create a signal to represent current stationId as defined by route params
  private activeStationId = toSignal(ngRouterMergedSnapshot$(this.router).pipe(map(({ params }) => params.stationId)));

  constructor(
    private supabaseService: SupabaseService,
    private api: ClimateApiService,
    private notificationService: PicsaNotificationService,
    private router: Router,
    private deploymentSevice: DeploymentDashboardService
  ) {
    super();
    this.ready();
    // Update list of available stations for deployment country code and station id on change
    effect(async () => {
      const deployment = this.deploymentSevice.activeDeployment();
      const activeStationId = this.activeStationId();
      if (deployment) {
        await this.loadData(deployment, activeStationId);
      }
    });
  }

  public override async init() {
    await this.supabaseService.ready();
  }

  public async refreshData() {
    const deployment = this.deploymentSevice.activeDeployment();
    if (deployment) {
      const { country_code } = deployment;
      await this.listStations(country_code);
    }
  }

  private async loadData(deployment: IDeploymentRow, stationId?: string) {
    // allow configuration override for country_code
    const configuration = deployment.configuration as any;
    const targetCode = configuration.climate_country_code || deployment.country_code;
    // refresh list of stations on deployment country code change
    if (targetCode !== this.apiCountryCode) {
      this.apiCountryCode = targetCode;
      await this.ready();
      await this.listStations(targetCode);
    }
    // set active station if deployment and active station id selected
    if (stationId) {
      this.setActiveStation(stationId);
    }
  }

  private setActiveStation(id: string) {
    const station = this.stations().find((station) => station.station_id === id);
    if (station) {
      this.activeStation = station;
    } else {
      this.activeStation = undefined as any;
      throw new Error(`Station data not found`);
    }
  }

  private async listStations(country_code: string, allowRefresh = true) {
    // TODO - when running should refresh from server as cron task
    const { data, error } = await this.supabaseService.db
      .table('climate_stations')
      .select<'*', IStationRow>('*')
      .eq('country_code', country_code);
    if (error) {
      throw error;
    }
    if (data.length === 0 && allowRefresh) {
      await this.loadFromAPI.station(country_code);
      return this.listStations(country_code, false);
    }
    this.stations.set(data || []);
  }
}
