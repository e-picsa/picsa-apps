/* eslint-disable @nx/enforce-module-boundaries */
import { Injectable, signal } from '@angular/core';
import { Database } from '@picsa/server-types';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { arrayToHashmap } from '@picsa/utils';

type ITranslationDB = Database['public']['Tables']['translations'];
export type ITranslationRow = ITranslationDB['Row'];
export type ITranslationInsert = ITranslationDB['Insert'];

@Injectable({ providedIn: 'root' })
export class TranslationDashboardService extends PicsaAsyncService {
  public translations = signal<ITranslationRow[]>([]);

  /** Track a list of translations by id for lookup and local update */
  private translationsHashmap: Record<string, ITranslationRow> = {};

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
    this.translationsHashmap = arrayToHashmap(data, 'id');
  }
  // update a translation record by ID
  public async updateTranslationById(id: string, updatedData: Partial<ITranslationRow>) {
    // Save to DB
    const { error, data } = await this.supabaseService.db
      .table('translations')
      .update(updatedData)
      .eq('id', id)
      .select<'*', ITranslationRow>('*')
      .single();
    if (error) throw new Error(error.message);
    // Update current list
    this.translationsHashmap[id] = data;
    this.translations.set(Object.values(this.translationsHashmap));
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
  public async addTranslation(translation: ITranslationInsert): Promise<string> {
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

  /** WiP - method to export translations json used in app */
  public exportJson(data: ITranslationRow[], locale: string) {
    const json: Record<string, string> = {};
    for (const { text, ...columns } of data) {
      if (locale in columns) {
        const translatedText = columns[locale] || '';
        if (json[text] && json[text] !== translatedText) {
          console.warn('Duplicate translation skipped', text, translatedText, json[translatedText]);
        } else {
          json[text] = translatedText;
        }
      }
    }
    console.log(locale, json);
  }
}
