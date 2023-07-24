import { Injectable } from '@angular/core';

import { HARDCODED_FORMS } from '../../../data/forms';
import { PicsaDatabase_V2_Service } from '@picsa/shared/services/core/db_v2';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import * as FormSchema from '../schema/forms';
import { RxCollection } from 'rxdb';
import * as SubmissionSchema from '../schema/submissions';

@Injectable({ providedIn: 'root' })
export class MonitoringToolService extends PicsaAsyncService {
  constructor(private dbService: PicsaDatabase_V2_Service) {
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
}
