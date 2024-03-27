import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Database } from '@picsa/server-types';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { IStorageEntry } from '@picsa/shared/services/core/supabase/services/supabase-storage.service';

export type IMonitoringFormsRow = Database['public']['Tables']['monitoring_forms']['Row'];

export interface IMonitoringStorageEntry extends IStorageEntry {
  /** Url generated when upload to public bucket (will always be populated, even if bucket not public) */
  publicUrl: string;
}
@Injectable({ providedIn: 'root' })
export class MonitoringFormsDashboardService extends PicsaAsyncService {
  public forms: IMonitoringFormsRow[] = [];
  public TABLE_NAME = 'monitoring_forms';
  public SUBMISSIONS_TABLE_NAME = 'monitoring_tool_submissions';

  public get table() {
    return this.supabaseService.db.table(this.TABLE_NAME);
  }

  constructor(private supabaseService: SupabaseService, private http: HttpClient) {
    super();
  }

  public override async init() {
    await this.supabaseService.ready();
    await this.listMonitoringForms();
  }

  public async listMonitoringForms() {
    const { data, error } = await this.supabaseService.db.table(this.TABLE_NAME).select<'*', IMonitoringFormsRow>('*');
    if (error) {
      throw error;
    }
    this.forms = data || [];
  }

  // Fetch a form record by ID
  public async getFormById(id: string): Promise<IMonitoringFormsRow> {
    const { data, error } = await this.supabaseService.db.table(this.TABLE_NAME).select('*').eq('id', id).single();
    if (error) {
      throw error;
    }
    return data;
  }

  public async getSubmissions(formId: string) {
    const { data, error } = await this.supabaseService.db
      .table(this.SUBMISSIONS_TABLE_NAME)
      .select('*')
      .eq('formId', formId);
    if (error) {
      throw error;
    }
    return { data, error };
  }

  public async updateFormById(id: string, updatedForm: Partial<IMonitoringFormsRow>): Promise<IMonitoringFormsRow> {
    const { data, error } = await this.supabaseService.db
      .table(this.TABLE_NAME)
      .update(updatedForm)
      .eq('id', id)
      .single();
    if (error) {
      throw error;
    }
    return data;
  }

   submitFormToConvertXlsToXForm(file: any) {
    const url = 'https://xform-converter.picsa.app/api/v1/convert'; 
    return this.http.post(url, file);
  }
  submitFormToConvertXFormToEnketo(formData: FormData) {
    const url = 'https://enketo-converter.picsa.app/api/xlsform-to-enketo'; 
    return this.http.post(url, formData);
  }

}
