import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Database } from '@picsa/server-types';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { IStorageEntry } from '@picsa/shared/services/core/supabase/services/supabase-storage.service';
import { firstValueFrom, Observable } from 'rxjs';

export type IMonitoringFormsRow = Database['public']['Tables']['monitoring_forms']['Row'];
type IMonitoringFormsInsert = Database['public']['Tables']['monitoring_forms']['Insert'];

const FORMS_TABLE = 'monitoring_forms';
const SUBMISSIONS_TABLE = 'monitoring_tool_submissions';

export interface IMonitoringStorageEntry extends IStorageEntry {
  /** Url generated when upload to public bucket (will always be populated, even if bucket not public) */
  publicUrl: string;
}
@Injectable({ providedIn: 'root' })
export class MonitoringFormsDashboardService extends PicsaAsyncService {
  public forms: IMonitoringFormsRow[] = [];

  public get table() {
    return this.supabaseService.db.table(FORMS_TABLE);
  }

  constructor(
    private supabaseService: SupabaseService,
    private http: HttpClient,
    private notificationService: PicsaNotificationService,
  ) {
    super();
  }

  public override async init() {
    await this.supabaseService.ready();
  }

  public async listMonitoringForms() {
    const { data, error } = await this.supabaseService.db.table(FORMS_TABLE).select<'*', IMonitoringFormsRow>('*');
    if (error) {
      throw error;
    }
    this.forms = data || [];
  }

  // Fetch a form record by ID
  public async getFormById(id: string): Promise<IMonitoringFormsRow> {
    const { data, error } = await this.supabaseService.db.table(FORMS_TABLE).select('*').eq('id', id).single();
    if (error) {
      throw error;
    }
    return data;
  }

  public async getSubmissions(formId: string) {
    const { data, error } = await this.supabaseService.db.table(SUBMISSIONS_TABLE).select('*').eq('formId', formId);
    if (error) {
      throw error;
    }
    return { data, error };
  }

  public async updateFormById(id: string, updatedForm: IMonitoringFormsInsert): Promise<IMonitoringFormsRow> {
    const { data, error } = await this.supabaseService.db
      .table(FORMS_TABLE)
      .update(updatedForm)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      throw error;
    }
    return data;
  }
  public async createForm(newForm: IMonitoringFormsInsert): Promise<IMonitoringFormsRow | null> {
    const { data, error } = await this.supabaseService.db.table(FORMS_TABLE).insert(newForm).single();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  /**
   * Convert an xls form to xml-xform standard
   * @param file xls file representation
   * @returns xml string of converted form
   */
  async submitFormToConvertXlsToXForm(file: File) {
    const url = 'https://xform-converter.picsa.app/api/v1/convert';
    try {
      const { result } = await firstValueFrom(this.http.post(url, file) as Observable<XFormConvertRes>);
      return result;
    } catch (error: any) {
      throw new Error(error?.message || error);
      return null;
    }
  }
  /**
   * Convert
   * @param formData formData object with 'files' property that includes xml xform read as a File
   * @returns enketo entry of converted xmlform
   */
  async submitFormToConvertXFormToEnketo(formData: FormData) {
    const url = 'https://enketo-converter.picsa.app/api/xlsform-to-enketo';
    try {
      const { convertedFiles } = await firstValueFrom(this.http.post(url, formData) as Observable<IEnketoConvertRes>);
      return convertedFiles[0]?.content;
    } catch (error: any) {
      console.error(error);
      throw new Error(error?.message || error);
      return null;
    }
  }
}
/** Response model returned from xform-converter */
interface XFormConvertRes {
  /** http error if thrown */
  error: any;
  /** xml string of converted  */
  result: string;
  /** https status code, 200 indicates success */
  status: number;
}
/** Response model returned from enketo-converter */
interface IEnketoConvertRes {
  convertedFiles: {
    content: IEnketoConvertContent;
    filename: string;
  }[];
  message: string;
}
interface IEnketoConvertContent {
  form: string;
  languageMap: any;
  model: string;
  theme: string;
  transformerVersion: string;
}
