import { Injectable } from '@angular/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Database } from '@picsa/server-types';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
// import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { IStorageEntry } from '@picsa/shared/services/core/supabase/services/supabase-storage.service';

export type ITranslationRow = Database['public']['Tables']['translations']['Row'];

export interface IResourceStorageEntry extends IStorageEntry {
  /** Url generated when upload to public bucket (will always be populated, even if bucket not public) */
  publicUrl: string;
}
@Injectable({ providedIn: 'root' })
export class TranslationDashboardService extends PicsaAsyncService {

  public  translations: ITranslationRow[] = [];

  public get table() {
    return this.supabaseService.db.table('translations');
  }

  constructor(private supabaseService: SupabaseService) {
    super();
  }

  public override async init() {
    await this.supabaseService.ready();
    await this.listTranslations();
  }


  public async listTranslations() {
    const { data, error } = await this.supabaseService.db.table('translations').select<'*', ITranslationRow>('*');
    if (error) {
      throw error;
    }
    this.translations = data || [];
  }
   
  // update a translation record by ID
  public async updateTranslationById(id: number, updatedData: Partial<ITranslationRow>): Promise<string> {
    const { data, error } = await this.supabaseService.db.table('translations').update(updatedData).eq('id', id);
    if (error) {
      throw error;
    }
    return "Updated successfully";
  }

  // Fetch a translation record by ID
  public async getTranslationById(id: number): Promise<ITranslationRow> {
    const { data, error } = await this.supabaseService.db.table('translations').select('*').eq('id', id).single();
    if (error) {
      throw error;
    }
    return data;
  }

  //delete function 
  public async deleteTranslationById(id: number): Promise<string> {
    const { error } = await this.supabaseService
      .db
      .table('translations')
      .delete()
      .eq('id', id);
  
    if (error) {
      throw error;
    }
    return "Deleted Successfully"
  }

// In your TranslationDashboardService
public async addTranslation(translation: Partial<ITranslationRow>): Promise<string> {
  const { data, error } = await this.supabaseService
    .db
    .table('translations')
    .insert([translation]);

  if (error) {
    throw error;
  }
  return "Added successfully";
}
}