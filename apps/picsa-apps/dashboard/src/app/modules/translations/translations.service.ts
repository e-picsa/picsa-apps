import { Injectable, signal } from '@angular/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Database } from '@picsa/server-types';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
// import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

export type ITranslationRow = Database['public']['Tables']['translations']['Row'];

@Injectable({ providedIn: 'root' })
export class TranslationDashboardService extends PicsaAsyncService {
  public translations = signal<ITranslationRow[]>([]);

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
    this.translations.set(data || []);
  }
  // update a translation record by ID
  public async updateTranslationById(id: string, updatedData: Partial<ITranslationRow>) {
    const { error, data } = await this.supabaseService.db
      .table('translations')
      .update(updatedData)
      .eq('id', id)
      .select<'*', ITranslationRow>('*');
    if (error) throw new Error(error.message);
    return data;
  }

  // Fetch a translation record by ID
  public async getTranslationById(id: string): Promise<ITranslationRow> {
    const { data, error } = await this.supabaseService.db.table('translations').select('*').eq('id', id).single();
    if (error) {
      throw error;
    }
    return data;
  }

  //delete function
  public async deleteTranslationById(id: string): Promise<string> {
    const { error } = await this.supabaseService.db.table('translations').delete().eq('id', id);

    if (error) {
      throw error;
    }
    return 'Deleted Successfully';
  }

  // In your TranslationDashboardService
  public async addTranslation(translation: Partial<ITranslationRow>): Promise<string> {
    translation.id = this.generateTranslationID(translation as ITranslationRow);
    const { data, error } = await this.supabaseService.db.table('translations').insert([translation]);

    if (error) {
      throw error;
    }
    return 'Added successfully';
  }

  /** Composite id generated by combination of row metadata and en text */
  public generateTranslationID(row: ITranslationRow) {
    // Convert to lower case and remove non-alphanumeric characters so that minor text differences ignored
    const { tool, context, text } = row;
    return [tool, context, text].map((t) => t?.toLowerCase().replace(/[^a-z0-9]/g, '')).join('-');
  }
}
