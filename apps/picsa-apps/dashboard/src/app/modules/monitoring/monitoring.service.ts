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
  public TABLE_NAME = 'monitoring_forms'
  public SUBMISSIONS_TABLE_NAME = 'monitoring_tool_submissions'

  public get table() {
    return this.supabaseService.db.table(this.TABLE_NAME);
  }

  constructor(private supabaseService: SupabaseService) {
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

  public async getSubmissionsByLocalFormId(id: string){
    const { data, error } = await this.supabaseService.db.table(this.SUBMISSIONS_TABLE_NAME).select('*').eq('formId', id);
    if (error) {
      throw error;
    }
    return {data, error};
  }

}
