import { computed, Injectable, signal } from '@angular/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Database } from '@picsa/server-types';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { arrayToHashmap } from '@picsa/utils';

import { DeploymentDashboardService } from '../../deployment/deployment.service';

export type ICropData = Database['public']['Tables']['crop_data'];

export type ICropDataDownscaled = Database['public']['Tables']['crop_data_downscaled'];

// Specify more accurate type for downscaled water requirement (db type is just JSON)
export type ICropDataDownscaledWaterRequirements = { [crop: string]: { [variety: string]: number } };

export type ICropDataMergedWaterRequirement = { location_id: string; water_requirement: number };

export type ICropDataMerged = ICropData['Row'] & { downscaled: ICropDataMergedWaterRequirement[] };

@Injectable({ providedIn: 'root' })
export class CropInformationService extends PicsaAsyncService {
  public get cropDataTable() {
    return this.supabaseService.db.table<'crop_data', ICropData>('crop_data');
  }
  public get cropDataDownscaledTable() {
    return this.supabaseService.db.table<'crop_data_downscaled', ICropDataDownscaled>('crop_data_downscaled');
  }

  public cropData = signal<ICropData['Row'][]>([]);
  public downscaledData = signal<ICropDataDownscaled['Row'][]>([]);
  public cropDataMerged = computed(() => {
    const data = this.cropData();
    const downscaledData = this.downscaledData();
    return this.mergeData(data, downscaledData);
  });

  constructor(
    private supabaseService: SupabaseService,
    private dashboardService: DeploymentDashboardService,
    private notificationService: PicsaNotificationService
  ) {
    super();
  }

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

  /** Load data from crop_data and crop_data_downscaled tables */
  private async loadCropData() {
    const { country_code } = this.dashboardService.activeDeployment();
    const promises = [
      this.cropDataTable.select<'*', ICropData['Row']>('*').order('id'),
      this.cropDataDownscaledTable.select<'*', ICropDataDownscaled['Row']>('*').eq('country_code', country_code),
    ];
    // wait for both requests to resolve successfully with data before updating signals
    const [dataRes, downscaledDataRes] = await Promise.allSettled(promises);
    if (dataRes.status === 'fulfilled' && downscaledDataRes.status === 'fulfilled') {
      const data = dataRes.value.data;
      const downscaledData = downscaledDataRes.value.data;
      if (data && downscaledData) {
        this.cropData.set(data as ICropData['Row'][]);
        this.downscaledData.set(downscaledData as ICropDataDownscaled['Row'][]);
        console.log('crop data loaded');
        return;
      }
    }
    // handle errors
    console.error(dataRes, downscaledDataRes);
    throw new Error(`Data fetching failed, see console logs for details`);
  }

  /** Merge baseline crop data with downscaled water requirements */
  private mergeData(data: ICropData['Row'][] = [], downscaled: ICropDataDownscaled['Row'][] = []) {
    // Create placeholder merged data for better type inference
    const mergedData: ICropDataMerged[] = data.map((v) => ({ ...v, downscaled: [] }));
    const mergedHashmap = arrayToHashmap(mergedData, 'id');

    // Extract individual crop probabilities from downscaled data and merge into crop data
    for (const { location_id, water_requirements } of downscaled) {
      for (const [crop, varietyData] of Object.entries(water_requirements as ICropDataDownscaledWaterRequirements)) {
        for (const [variety, water_requirement] of Object.entries(varietyData)) {
          const hash = `${crop}/${variety}`;
          if (hash in mergedHashmap) {
            mergedHashmap[hash].downscaled.push({ location_id, water_requirement });
          } else {
            console.warn(`no variety data for water requirement`, crop, variety);
          }
        }
      }
    }
    return Object.values(mergedData);
  }
}
