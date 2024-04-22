import { Injectable } from '@angular/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Database } from '@picsa/server-types';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { IStorageEntry } from '@picsa/shared/services/core/supabase/services/supabase-storage.service';

export type ICropInformationRow = Database['public']['Tables']['crop_data']['Row'];
export type ICropInformationInsert = Database['public']['Tables']['crop_data']['Insert'];
export type ICropInformationUpdate = Database['public']['Tables']['crop_data']['Update'];

export interface IResourceStorageEntry extends IStorageEntry {
  /** Url generated when upload to public bucket (will always be populated, even if bucket not public) */
  publicUrl: string;
}

@Injectable({ providedIn: 'root' })
export class CropInformationService extends PicsaAsyncService {
  public cropProbabilities: ICropInformationRow[] = [];

  public get table() {
    return this.supabaseService.db.table('crop_data');
  }

  constructor(private supabaseService: SupabaseService) {
    super();
  }

  public override async init() {
    await this.supabaseService.ready();
    await this.list();
  }

  public async list() {
    const { data, error } = await this.table.select<'*', ICropInformationRow>('*');
    if (error) {
      throw error;
    }
    this.cropProbabilities = data || [];
  }

  public async insert(cropInfo: ICropInformationInsert) {
    const { data, error } = await this.table.insert(cropInfo);
    if (error) {
      throw error;
    }
    return data;
  }
  public async update(cropInfo: ICropInformationUpdate) {
    const { id, ...update } = cropInfo;
    const { data, error } = await this.supabaseService.db.table('crop_data').update(update).eq('id', id);
    if (error) {
      throw error;
    }
    return data;
  }
}
