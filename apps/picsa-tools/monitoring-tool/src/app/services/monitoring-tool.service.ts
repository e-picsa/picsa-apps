import { Injectable } from '@angular/core';
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

  constructor(private dbService: PicsaDatabase_V2_Service, private syncService: PicsaDatabaseSyncService) {
    super();
  }

  /**
   * Initialisation method automatically called on instantiation
   * Await completed state via the service `ready()` property
   */
  public override async init() {
    await this.dbService.ensureCollections({
      monitoring_tool_forms: FormSchema.COLLECTION,
      monitoring_tool_submissions: SubmissionSchema.COLLECTION,
    });
    this.listPendingSync();
    await this.dbFormCollection.bulkUpsert(HARDCODED_FORMS);
  }

  /** Provide database options tool collection (with typings) */
  public get dbFormCollection() {
    return this.dbService.db.collections['monitoring_tool_forms'] as RxCollection<FormSchema.IMonitoringForm>;
  }

  /** Provide database options tool collection (with typings) */
  public get dbSubmissionsCollection() {
    return this.dbService.db.collections[
      'monitoring_tool_submissions'
    ] as RxCollection<SubmissionSchema.IFormSubmission>;
  }

  public async getSubmissions(formId: string) {
    return this.dbSubmissionsCollection.find({ selector: { formId } });
  }

  public async createNewSubmission(formId: string) {
    const template = SubmissionSchema.ENTRY_TEMPLATE(formId);
    console.log({ formId, template });
    // template.formId = formId;
    await this.dbSubmissionsCollection.insert(template);
    return template;
  }

  public async getForm(formId: string, entry?: string) {
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
   * Attempt to force sync of records. Note, syncing should be automated however method could be used to
   * help determine any sync errors
   */
  public syncPending() {
    return this.syncService.syncPendingDocs(this.dbSubmissionsCollection);
  }

  private listPendingSync() {
    const selector = { _sync_push_status: 'ready' };
    this.dbSubmissionsCollection.find({ selector }).$.subscribe((res) => {
      this.pendingSyncCount = res.length;
    });
  }
}
