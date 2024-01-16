import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Database } from '@picsa/server-types';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { IStorageEntry } from '@picsa/shared/services/core/supabase/services/supabase-storage.service';
import { ngRouterMergedSnapshot$ } from '@picsa/utils';

import { ClimateDataApiService } from './climate-data-api.service';

export type IStationRow = Database['public']['Tables']['climate_stations']['Row'];

export interface IResourceStorageEntry extends IStorageEntry {
  /** Url generated when upload to public bucket (will always be populated, even if bucket not public) */
  publicUrl: string;
}

export type IResourceEntry = Database['public']['Tables']['resources']['Row'];

@Injectable({ providedIn: 'root' })
export class ClimateDataDashboardService extends PicsaAsyncService {
  public apiStatus: number;
  public stations: IStationRow[] = [];
  public activeStation: IStationRow;

  constructor(
    private supabaseService: SupabaseService,
    private api: ClimateDataApiService,
    private notificationService: PicsaNotificationService,
    private router: Router
  ) {
    super();
    this.ready();
  }

  public override async init() {
    await this.supabaseService.ready();
    await this.checkStatus();
    await this.listStations();
    this.subscribeToRouteChanges();
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
    ngRouterMergedSnapshot$(this.router).subscribe(({ params }) => {
      if (params.stationId) {
        this.setActiveStation(parseInt(params.stationId));
      }
    });
  }

  private async checkStatus() {
    await this.api.useMeta('serverStatus').GET('/v1/status/');
  }

  private async listStations() {
    // HACK - endpoint not operational
    // TODO - when running should refresh from server as cron task
    const { data, error } = await this.supabaseService.db.table('climate_stations').select<'*', IStationRow>('*');
    if (error) {
      throw error;
    }
    if (data.length === 0) {
      this.notificationService.showUserNotification({
        matIcon: 'warning',
        message: 'climate_stations_rows must be imported into database for this feature to work',
      });
    }
    this.stations = data || [];
  }
}
