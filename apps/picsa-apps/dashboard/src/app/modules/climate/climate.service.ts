import { effect, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { ngRouterMergedSnapshot$ } from '@picsa/utils/angular';
import { map } from 'rxjs';

import { DeploymentDashboardService } from '../deployment/deployment.service';
import { IDeploymentRow } from '../deployment/types';
import { ApiMapping } from './climate-api.mapping';
import { ClimateApiService } from './climate-api.service';
import { IStationRow } from './types';

@Injectable({ providedIn: 'root' })
export class ClimateService extends PicsaAsyncService {
  public apiStatus: number;
  public stations: IStationRow[] = [];
  public activeStation: IStationRow;

  /** Trigger API request that includes mapping response to local database */
  public loadFromAPI = ApiMapping(
    this.api,
    this.supabaseService.db,
    this.supabaseService.storage,
    this.deploymentSevice.activeDeployment() as IDeploymentRow
  );

  // Create a signal to represent current stationId as defined by route params
  private activeStationId = toSignal(ngRouterMergedSnapshot$(this.router).pipe(map(({ params }) => params.stationId)));
  private activeCountryCode: string;

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
    // refresh list of stations on deployment country code change
    if (deployment.country_code !== this.activeCountryCode) {
      this.activeCountryCode = deployment.country_code;
      await this.ready();
      await this.listStations(deployment.country_code);
    }
    // set active station if deployment and active station id selected
    if (stationId) {
      this.setActiveStation(stationId);
    }
  }

  private setActiveStation(id: string) {
    const station = this.stations.find((station) => station.station_id === id);
    if (station) {
      this.activeStation = station;
    } else {
      this.activeStation = undefined as any;
      this.notificationService.showErrorNotification(`Station data not found`);
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
      await this.loadFromAPI.station();
      return this.listStations(country_code, false);
    }
    this.stations = data || [];
  }
}
