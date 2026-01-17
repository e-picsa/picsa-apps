import { inject,Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PicsaTranslateService } from '@picsa/shared/modules';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { PicsaDatabase_V2_Service } from '@picsa/shared/services/core/db_v2';
import { PicsaDatabaseSyncService } from '@picsa/shared/services/core/db_v2/db-sync.service';
import { RxCollection } from 'rxdb';

import { HARDCODED_FORMS } from '../../../data/forms';
import { MONITITORING_STRINGS } from '../models/strings';
import * as FormSchema from '../schema/forms';
import * as SubmissionSchema from '../schema/submissions';

@Injectable({ providedIn: 'root' })
export class MonitoringToolService extends PicsaAsyncService {
  private dbService = inject(PicsaDatabase_V2_Service);
  private syncService = inject(PicsaDatabaseSyncService);
  private translateService = inject(PicsaTranslateService);
  private snackBar = inject(MatSnackBar);

  /** Track number of items pending push to server db (0 value implies fully synced) */
  public pendingSyncCount = -1;

  /**
   * Initialisation method automatically called on instantiation
   * Await completed state via the service `ready()` property
   */
  public override async init(): Promise<void> {
    await this.dbService.ensureCollections({
      monitoring_tool_forms: FormSchema.COLLECTION,
      monitoring_tool_submissions: SubmissionSchema.COLLECTION,
    });
    await this.loadHardcodedForms();
    this.listPendingSync();
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

    await this.dbFormCollection.bulkUpsert(hardcodedWithUnlockStatus);
  }
}
