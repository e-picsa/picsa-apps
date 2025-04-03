import { Injectable, signal } from '@angular/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Database } from '@picsa/server-types';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

export type ICropInformationRow = Database['public']['Tables']['crop_data']['Row'];
export type ICropInformationInsert = Database['public']['Tables']['crop_data']['Insert'];
export type ICropInformationUpdate = Database['public']['Tables']['crop_data']['Update'];

export type ICropDataDownscaled = Database['public']['Tables']['crop_data_downscaled'];

@Injectable({ providedIn: 'root' })
export class CropInformationService extends PicsaAsyncService {
  public cropProbabilities: ICropInformationRow[] = [];

  public get cropDataTable() {
    return this.supabaseService.db.table('crop_data');
  }
  public get cropDataDownscaledTable() {
    return this.supabaseService.db.table('crop_data_downscaled');
  }

  public cropData = signal<ICropInformationRow[]>([]);

  constructor(private supabaseService: SupabaseService) {
    super();
  }

  public override async init() {
    await this.supabaseService.ready();
    await this.list();
  }

  public async list() {
    // TODO - filter for country code, maybe create as resource...
    const { data, error } = await this.cropDataTable.select<'*', ICropInformationRow>('*').order('id');
    if (error) {
      throw error;
    }
    this.cropProbabilities = data || [];
    this.cropData.set(data);
  }

  public async insert(cropInfo: ICropInformationInsert) {
    const { data, error } = await this.cropDataTable.insert(cropInfo);
    if (error) {
      throw error;
    }
    return data;
  }
  public async update(cropInfo: ICropInformationUpdate) {
    const { id, ...update } = cropInfo;
    const { data, error } = await this.cropDataTable.update(update).eq('id', id);
    if (error) {
      throw error;
    }
    return data;
  }
}
