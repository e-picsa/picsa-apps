import { Injectable, signal } from '@angular/core';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { PicsaDatabase_V2_Service } from '@picsa/shared/services/core/db_v2';
import { PicsaDatabaseSyncService } from '@picsa/shared/services/core/db_v2/db-sync.service';
import { RxCollection } from 'rxdb';

import { HARDCODED_FORMS } from '../../../data/forms';
import * as FormSchema from '../schema/forms';
import * as SubmissionSchema from '../schema/submissions';

@Injectable({ providedIn: 'root' })
export class MonitoringToolService extends PicsaAsyncService {
  /** Track number of items pending push to server db (0 value implies fully synced) */
  public pendingSyncCount = -1;

  /** Signal to track which forms are currently being unlocked */
  public unlockingForms = signal<string[]>([]);

  // Map to track form auto-lock timers
  private formLockTimers: Map<string, any> = new Map();

  // Default inactivity timeout in milliseconds (15 minutes)
  private readonly INACTIVITY_TIMEOUT = 15 * 60 * 1000;

  constructor(private dbService: PicsaDatabase_V2_Service, private syncService: PicsaDatabaseSyncService) {
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
    this.listPendingSync();
    await this.dbFormCollection.bulkUpsert(HARDCODED_FORMS);
  }

  /** Provide database options tool collection (with typings) */
  public get dbFormCollection(): RxCollection<FormSchema.IMonitoringForm> {
    return this.dbService.db.collections['monitoring_tool_forms'] as RxCollection<FormSchema.IMonitoringForm>;
  }

  /** Provide database options tool collection (with typings) */
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

  /**
   * Unlock a form by setting access_unlocked to true and start auto-lock timer
   */
  public async unlockForm(formId: string): Promise<boolean> {
    try {
      // Add form to unlocking list
      this.unlockingForms.update((forms) => [...forms, formId]);

      const formDoc = await this.dbFormCollection.findOne(formId).exec();
      if (!formDoc) {
        console.error('could not find form with id', formId);
        return false;
      }

      await formDoc.incrementalPatch({ access_unlocked: true });

      // Set up auto-lock timer
      this.setupAutoLockTimer(formId);

      return true;
    } catch (error) {
      console.error('Error unlocking form:', error);
      return false;
    } finally {
      // Remove form from unlocking list
      this.unlockingForms.update((forms) => forms.filter((id) => id !== formId));
    }
  }

  /**
   * Reset the auto-lock timer for a form when there is activity
   */
  public resetAutoLockTimer(formId: string): void {
    // Clear existing timer
    this.clearAutoLockTimer(formId);

    // Set up a new timer
    this.setupAutoLockTimer(formId);
  }

  /**
   * Clear the auto-lock timer for a form
   */
  public clearAutoLockTimer(formId: string): void {
    if (this.formLockTimers.has(formId)) {
      clearTimeout(this.formLockTimers.get(formId));
      this.formLockTimers.delete(formId);
    }
  }

  /**
   * Setup auto-lock timer for a form
   */
  private setupAutoLockTimer(formId: string): void {
    const timer = setTimeout(async () => {
      await this.lockForm(formId);
    }, this.INACTIVITY_TIMEOUT);

    this.formLockTimers.set(formId, timer);
  }

  /**
   * Lock a form by setting access_unlocked to false
   */
  private async lockForm(formId: string): Promise<boolean> {
    try {
      const formDoc = await this.dbFormCollection.findOne(formId).exec();
      if (!formDoc) {
        console.error('could not find form with id', formId);
        return false;
      }

      await formDoc.incrementalPatch({ access_unlocked: false });
      return true;
    } catch (error) {
      console.error('Error locking form:', error);
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

  private listPendingSync(): void {
    const selector = { _sync_push_status: 'ready' };
    this.dbSubmissionsCollection.find({ selector }).$.subscribe((res) => {
      this.pendingSyncCount = res.length;
    });
  }
}
