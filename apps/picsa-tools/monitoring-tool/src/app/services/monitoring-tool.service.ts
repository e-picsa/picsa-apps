import { Injectable } from '@angular/core';
import { arrayToHashmap } from '@picsa/utils';

import { HARDCODED_FORMS } from '../../../data/forms';
import { PicsaDatabase_V2_Service } from '@picsa/shared/services/core/db_v2';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { COLLECTION, IMonitoringForm } from '../schema/forms';
import { RxCollection } from 'rxdb';

@Injectable({ providedIn: 'root' })
export class MonitoringToolService extends PicsaAsyncService {
  public forms = HARDCODED_FORMS;
  private formsById = arrayToHashmap(HARDCODED_FORMS, '_id');

  constructor(private dbService: PicsaDatabase_V2_Service) {
    super();
  }

  /**
   * Initialisation method automatically called on instantiation
   * Await completed state via the service `ready()` property
   */
  public override async init() {
    await this.dbService.ensureCollections({
      monitoring_tool_forms: COLLECTION,
    });
    await this.dbFormCollection.bulkUpsert(HARDCODED_FORMS);
    console.log('forms upserted');
  }

  /** Provide database options tool collection (with typings) */
  public get dbFormCollection() {
    return this.dbService.db.collections['monitoring_tool_forms'] as RxCollection<IMonitoringForm>;
  }

  public getForm(formId: string, entry?: string) {
    const form = this.formsById[formId];
    if (!form) {
      console.error('could not find form with id', formId);
      return undefined;
    }
    return form;
  }
}
