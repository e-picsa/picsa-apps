import { computed, inject, Injectable, signal } from '@angular/core';
import { Database } from '@picsa/server-types';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { arrayToHashmap } from '@picsa/utils';

import { DeploymentDashboardService } from '../../deployment/deployment.service';

export type ICropData = Database['public']['Tables']['crop_data'];

export type ICropDataDownscaled = Database['public']['Tables']['crop_data_downscaled'];

export type IClimateStationData = Database['public']['Tables']['climate_station_data'];

export type IClimateStations = Database['public']['Tables']['climate_stations'];

// Specify more accurate type for downscaled water requirement (db type is just JSON)
export type ICropDataDownscaledWaterRequirements = { [crop: string]: { [variety: string]: number } };

export type ICropDataMergedWaterRequirement = { location_id: string; water_requirement: number };

export type ICropDataMerged = ICropData['Row'] & { downscaled: ICropDataMergedWaterRequirement[] };

// Station data with joined station metadata
export type IStationDataWithMeta = IClimateStationData['Row'] & {
  station: IClimateStations['Row'] | null;
};

@Injectable({ providedIn: 'root' })
export class CropInformationService extends PicsaAsyncService {
  private supabaseService = inject(SupabaseService);
  private dashboardService = inject(DeploymentDashboardService);
  private notificationService = inject(PicsaNotificationService);

  public get cropDataTable() {
    return this.supabaseService.db.table('crop_data');
  }
  public get cropDataDownscaledTable() {
    return this.supabaseService.db.table('crop_data_downscaled');
  }
  public get stationDataTable() {
    return this.supabaseService.db.table('climate_station_data');
  }
  public get stationsTable() {
    return this.supabaseService.db.table('climate_stations');
  }

  public cropData = signal<ICropData['Row'][]>([]);
  public downscaledData = signal<ICropDataDownscaled['Row'][]>([]);
  public stationData = signal<IStationDataWithMeta[]>([]);
  public cropDataMerged = computed(() => {
    const data = this.cropData();
    const downscaledData = this.downscaledData();
    return this.mergeData(data, downscaledData);
  });

  public override async init() {
    await this.supabaseService.ready();
    await this.loadCropData();
  }

  /******************************************************************************************
   * DB Methods
   * Ensure db operations notify user feedback and refresh data
   ****************************************************************************************/

  public async delete(id: string) {
    const { error } = await this.cropDataTable.delete().eq('id', id);
    if (error) {
      throw error;
    }
    this.notificationService.showSuccessNotification(`Delete success`);
    this.loadCropData();
  }

  public async insert(rows: ICropData['Insert'][]) {
    const { error } = await this.cropDataTable.insert(rows);
    if (error) {
      throw error;
    }
    this.notificationService.showSuccessNotification(`Update success`);
    this.loadCropData();
  }

  public async upsert(rows: ICropData['Insert'][]) {
    const { error } = await this.cropDataTable.upsert(rows);
    if (error) {
      throw error;
    }
    this.notificationService.showSuccessNotification(`Import success`);
    this.loadCropData();
  }

  public async upsertDownscaled(rows: ICropDataDownscaled['Insert'][]) {
    const { error } = await this.cropDataDownscaledTable.upsert(rows);
    if (error) {
      this.notificationService.showErrorNotification(`${error.message}`);
      return;
    }
    this.loadCropData();
    this.notificationService.showSuccessNotification(`Import successful`);
  }

  /** Reload all crop data for the active deployment */
  public async reload() {
    await this.loadCropData();
  }

  /** Create empty placeholder records so locations missing entries appear in quality control */
  public async addPlaceholderLocations(locationIds: string[]) {
    const { country_code } = this.dashboardService.activeDeployment();
    const entries: ICropDataDownscaled['Insert'][] = locationIds.map((location_id) => ({
      country_code,
      location_id,
      water_requirements: {},
    }));
    const { error } = await this.cropDataDownscaledTable.upsert(entries);
    if (error) {
      this.notificationService.showErrorNotification(`${error.message}`);
      return;
    }
    await this.loadCropData();
    this.notificationService.showSuccessNotification(`Placeholder entries added`);
  }

  public async update(data: ICropData['Update']) {
    const { id, ...update } = data;
    // ensure id included to avoid updating all rows
    if (!id) return;
    const { error } = await this.cropDataTable.update(update).eq('id', id);
    if (error) {
      throw error;
    }
    this.notificationService.showSuccessNotification(`Update success`);
    this.loadCropData();
  }

  /******************************************************************************************
   * Core Methods
   ****************************************************************************************/

  /** Load data from crop_data, crop_data_downscaled, climate_station_data and climate_stations tables */
  private async loadCropData() {
    const { country_code } = this.dashboardService.activeDeployment();
    const promises = [
      this.cropDataTable.select<'*', ICropData['Row']>('*').eq('country_code', country_code).order('id'),
      this.cropDataDownscaledTable.select<'*', ICropDataDownscaled['Row']>('*').eq('country_code', country_code),
      // climate_station_data uses the newer country_code enum, cast to match deployment value
      this.stationDataTable.select<'*', IClimateStationData['Row']>('*').eq('country_code', country_code as never),
      this.stationsTable.select<'*', IClimateStations['Row']>('*').eq('country_code', country_code),
    ];
    // wait for all requests to resolve successfully with data before updating signals
    const [dataRes, downscaledDataRes, stationDataRes, stationsRes] = await Promise.allSettled(promises);
    if (
      dataRes.status === 'fulfilled' &&
      downscaledDataRes.status === 'fulfilled' &&
      stationDataRes.status === 'fulfilled' &&
      stationsRes.status === 'fulfilled'
    ) {
      const data = dataRes.value.data;
      const downscaledData = downscaledDataRes.value.data;
      const stationData = stationDataRes.value.data;
      const stations = stationsRes.value.data;
      if (data && downscaledData && stationData && stations) {
        this.cropData.set(data as ICropData['Row'][]);
        this.downscaledData.set(downscaledData as ICropDataDownscaled['Row'][]);
        // Merge station metadata client-side (climate_station_data.station_id references climate_stations.id)
        const stationsHashmap = arrayToHashmap(stations as IClimateStations['Row'][], 'id');
        const mergedStationData = (stationData as IClimateStationData['Row'][]).map((row) => ({
          ...row,
          station: stationsHashmap[row.station_id] ?? null,
        }));
        this.stationData.set(mergedStationData);
        return;
      }
    }
    // handle errors
    console.error(dataRes, downscaledDataRes, stationDataRes, stationsRes);
    throw new Error(`Data fetching failed, see console logs for details`);
  }

  /** Merge baseline crop data with downscaled water requirements */
  private mergeData(data: ICropData['Row'][] = [], downscaled: ICropDataDownscaled['Row'][] = []) {
    // Create placeholder merged data for better type inference
    const mergedData: ICropDataMerged[] = data.map((v) => ({ ...v, downscaled: [] }));
    const mergedHashmap = arrayToHashmap(mergedData, 'id', (v) => `${v.crop}/${v.variety}`);

    // Extract individual crop probabilities from downscaled data and merge into crop data
    const missing = {};
    for (const { location_id, water_requirements } of downscaled) {
      for (const [crop, varietyData] of Object.entries(water_requirements as ICropDataDownscaledWaterRequirements)) {
        for (const [variety, water_requirement] of Object.entries(varietyData)) {
          const hash = `${crop}/${variety}`;
          if (hash in mergedHashmap) {
            mergedHashmap[hash].downscaled.push({ location_id, water_requirement });
          } else {
            // No variety data for water requirement
            missing[hash] = true;
          }
        }
      }
    }
    if (Object.keys(missing).length > 0) {
      // Missing variety data likely due to import errors (e.g. duplicate values not reconciled)
      // console.warn(`Variety does not exist for water requirements:`, Object.keys(missing).sort());
    }

    return Object.values(mergedData);
  }
}
