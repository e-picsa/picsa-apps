import { Injectable } from '@angular/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Database } from '@picsa/server-types';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { IStorageEntry } from '@picsa/shared/services/core/supabase/services/supabase-storage.service';

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

  constructor(private supabaseService: SupabaseService, private api: ClimateDataApiService) {
    super();
  }

  public override async init() {
    await this.supabaseService.ready();
    await this.checkStatus();
    await this.listStations();
  }

  public setActiveStation(station: IStationRow) {
    this.activeStation = station;
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
    this.stations = data || [];
  }
}
