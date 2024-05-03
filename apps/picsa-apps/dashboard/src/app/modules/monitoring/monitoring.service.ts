import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Database } from '@picsa/server-types';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { IStorageEntry } from '@picsa/shared/services/core/supabase/services/supabase-storage.service';
import { firstValueFrom, Observable } from 'rxjs';

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

  constructor(
    private supabaseService: SupabaseService,
    private http: HttpClient,
    private notificationService: PicsaNotificationService
  ) {
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
      .select()
      .single();
    if (error) {
      throw error;
    }
    return data;
  }
  public async createForm(newForm: Partial<IMonitoringFormsRow>): Promise<IMonitoringFormsRow> {
    newForm.id = this.generateId(newForm.title ? newForm.title : null);
    const { data, error } = await this.supabaseService.db.table(this.TABLE_NAME).insert(newForm).single();
    if (error) {
      throw error;
    }
    return data;
  }

  // adopting this id genrating funtion
  private generateId(title: string | null) {
    const cleanedText = title
      ?.toLowerCase()
      .replace(/[^a-z ]/gi, '')
      .replace(/\s+/g, '_');
    return title ? cleanedText : '';
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
      console.error(error);
      this.notificationService.showUserNotification({ matIcon: 'error', message: error?.message || error });
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
      this.notificationService.showUserNotification({ matIcon: 'error', message: error?.message || error });
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
