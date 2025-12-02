import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PicsaTranslateService } from '@picsa/shared/modules';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { PicsaDatabase_V2_Service } from '@picsa/shared/services/core/db_v2';
import { PicsaDatabaseSyncService } from '@picsa/shared/services/core/db_v2/db-sync.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { RxCollection } from 'rxdb';

import { HARDCODED_FORMS } from '../../../data/forms';
import { MONITITORING_STRINGS } from '../models/strings';
import * as FormSchema from '../schema/forms';
import { SERVER_DB_MAPPING } from '../schema/forms/server-mapping';
import * as SubmissionSchema from '../schema/submissions';
import { IMonitoringFormsRow } from '../types/monitoring.types';

@Injectable({ providedIn: 'root' })
export class MonitoringToolService extends PicsaAsyncService {
  /** Track number of items pending push to server db (0 value implies fully synced) */
  public pendingSyncCount = -1;

  constructor(
    private dbService: PicsaDatabase_V2_Service,
    private syncService: PicsaDatabaseSyncService,
    private translateService: PicsaTranslateService,
    private snackBar: MatSnackBar,
    private supabaseService: SupabaseService,
  ) {
    super();
  }

  /**
   * Initialisation method automatically called on instantiation
   * Await completed state via the service `ready()` property
   */
  public override async init(): Promise<void> {
    await this.dbService.ensureCollections({
      monitoring_tool_forms: FormSchema.COLLECTION,
      monitoring_tool_submissions: SubmissionSchema.COLLECTION,
    });
    await this.supabaseService.ready();
    await this.loadHardcodedForms();
    await this.loadServerForms();
    this.listPendingSync();
  }

  public get dbFormCollection(): RxCollection<FormSchema.IMonitoringForm> {
    return this.dbService.db.collections['monitoring_tool_forms'] as RxCollection<FormSchema.IMonitoringForm>;
  }

  public get dbSubmissionsCollection(): RxCollection<SubmissionSchema.IFormSubmission> {
    return this.dbService.db.collections[
      'monitoring_tool_submissions'
    ] as RxCollection<SubmissionSchema.IFormSubmission>;
  }

  public async getSubmissions(formId: string) {
    return this.dbSubmissionsCollection.find({ selector: { formId } });
  }

  public async createNewSubmission(formId: string): Promise<SubmissionSchema.IFormSubmission> {
    const template = SubmissionSchema.ENTRY_TEMPLATE(formId);
    await this.dbSubmissionsCollection.insert(template);
    return template;
  }

  public async getForm(formId: string, entry?: string): Promise<FormSchema.IMonitoringForm | undefined> {
    const doc = await this.dbFormCollection.findOne(formId).exec();
    if (!doc) {
      console.error('could not find form with id', formId);
      return undefined;
    }

    return doc._data;
  }

  public getFormSubmissionsQuery(formId: string) {
    return this.dbService.activeUserQuery(this.dbSubmissionsCollection, { formId });
  }

  public async unlockForm(id: string): Promise<boolean> {
    try {
      const formDoc = await this.dbFormCollection.findOne(id).exec();
      if (!formDoc) {
        console.error('could not find form with id', id);
        return false;
      }

      await formDoc.patch({ access_unlocked: true });

      return true;
    } catch (error) {
      console.error('Error unlocking form:', error);
      return false;
    }
  }

  /**
   * Attempt to force sync of records. Note, syncing should be automated however method could be used to
   * help determine any sync errors
   */
  public syncPending() {
    return this.syncService.syncPendingDocs(this.dbSubmissionsCollection);
  }

  public async showMessage(string: keyof typeof MONITITORING_STRINGS) {
    const msg = await this.translateService.translateText(MONITITORING_STRINGS[string]);
    const closeText = await this.translateService.translateText(MONITITORING_STRINGS.CLOSE_BUTTON_TEXT);
    this.snackBar.open(msg, closeText, {
      duration: 3000,
    });
  }

  private listPendingSync(): void {
    const selector = { _sync_push_status: 'ready' };
    this.dbSubmissionsCollection.find({ selector }).$.subscribe((res) => {
      this.pendingSyncCount = res.length;
    });
  }

  /** Load forms from hardcoded data, preserving unlock status */
  private async loadHardcodedForms() {
    const allForms = await this.dbFormCollection.find().exec();
    const unlockedForms = allForms.filter((f) => f.access_unlocked).map((f) => f._id);
    const hardcodedWithUnlockStatus = HARDCODED_FORMS.map((f) => {
      f.access_unlocked = unlockedForms.includes(f._id);
      return f;
    });

    const { error } = await this.dbFormCollection.bulkUpsert(hardcodedWithUnlockStatus);
    if (error.length > 0) {
      console.error('[Monitoring] Failed to upsert some hardcoded forms:', error);
    }
  }

  /**
   * Load forms from server database and sync to local cache.
   */
  private async loadServerForms() {
    try {
      const serverForms = await this.fetchServerForms();
      
      if (serverForms.length === 0) {
        return;
      }

      const existingForms = await this.dbFormCollection.find().exec();
      const unlockedFormIds = new Set(existingForms.filter((f) => f.access_unlocked).map((f) => f._id));

      const hardcodedFormIds = new Set(HARDCODED_FORMS.map(f => f._id));
      const newServerForms = serverForms.filter(form => !hardcodedFormIds.has(form._id));

      if (newServerForms.length === 0) {
        return;
      }

      const mappedForms = newServerForms
        .map((form) => {
          if (form && unlockedFormIds.has(form._id)) {
            form.access_unlocked = true;
          }
          return form;
        })
        .filter((f): f is FormSchema.IMonitoringForm => f !== null);

      const { error } = await this.dbFormCollection.bulkUpsert(mappedForms);
      if (error.length > 0) {
        console.error('[Monitoring] Failed to sync some server forms:', error);
      }
    } catch (error) {
      console.error('[Monitoring] Failed to load server forms:', error);
    }
  }

  /**
   * Fetch forms from Supabase database
   * Returns empty array if no forms found or on error
   */
  private async fetchServerForms(): Promise<FormSchema.IMonitoringForm[]> {
    const table = this.supabaseService.db.table('monitoring_forms');
    const { data, error } = await table.select<'*', IMonitoringFormsRow>('*');

    if (error) {
      console.error('[Monitoring] Error fetching server forms from database:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    const getPublicLink = (bucketId: string, objectPath: string) =>
      this.supabaseService.storage.getPublicLink(bucketId, objectPath);

    const mappedForms = data
      .map((row) => SERVER_DB_MAPPING(row, getPublicLink))
      .filter((form): form is FormSchema.IMonitoringForm => form !== null);

    return mappedForms;
  }
}
