import { effect, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { IStorageEntry } from '@picsa/shared/services/core/supabase/services/supabase-storage.service';
import { ngRouterMergedSnapshot$ } from '@picsa/utils/angular';

import { DeploymentDashboardService } from '../deployment/deployment.service';
import { IDeploymentRow } from '../deployment/types';
import { ApiMapping } from './climate-api.mapping';
import { ClimateApiService } from './climate-api.service';
import { IStationRow } from './types';

export interface IResourceStorageEntry extends IStorageEntry {
  /** Url generated when upload to public bucket (will always be populated, even if bucket not public) */
  publicUrl: string;
}

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

  constructor(
    private supabaseService: SupabaseService,
    private api: ClimateApiService,
    private notificationService: PicsaNotificationService,
    private router: Router,
    private deploymentSevice: DeploymentDashboardService
  ) {
    super();
    this.ready();
    // Update list of available stations for deployment country code on change
    effect(async () => {
      const deployment = this.deploymentSevice.activeDeployment();
      if (deployment) {
        await this.listStations(deployment.country_code);
      }
    });
  }

  public override async init() {
    await this.supabaseService.ready();
    this.subscribeToRouteChanges();
  }

  public async refreshData() {
    const deployment = this.deploymentSevice.activeDeployment();
    if (deployment) {
      const { country_code } = deployment;
      await this.listStations(country_code);
    }
  }

  private setActiveStation(id: number) {
    const station = this.stations.find((station) => station.station_id === id);
    if (station) {
      this.activeStation = station;
    } else {
      this.activeStation = undefined as any;
      this.notificationService.showUserNotification({ matIcon: 'error', message: `Station data not found` });
    }
  }

  private subscribeToRouteChanges() {
    // Use merged router as service cannot access route params directly like component
    ngRouterMergedSnapshot$(this.router).subscribe(async ({ params }) => {
      if (params.stationId) {
        await this.ready();
        this.setActiveStation(parseInt(params.stationId));
      }
    });
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
