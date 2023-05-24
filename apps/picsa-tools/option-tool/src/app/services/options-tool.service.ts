import { Injectable } from '@angular/core';
import { PicsaDatabase_V2_Service } from '@picsa/shared/services/core/db_v2';
import { RxCollection, RxDocument } from 'rxdb';

import { IOptionsToolEntry, SCHEMA_V0 } from '../schemas/schema_v0';

@Injectable({ providedIn: 'root' })
export class OptionsToolService {
  constructor(private dbService: PicsaDatabase_V2_Service) {}

  /** Provide database options tool collection (with typings) */
  public get dbCollection() {
    return this.dbService.db.collections['options_tool'] as RxCollection<IOptionsToolEntry>;
  }

  /** Initialise collection required for storing data to database */
  public async initialise() {
    await this.dbService.ensureCollections({
      options_tool: {
        // NOTE - any future changes to schema should be made as new doc with migration strategy
        // https://rxdb.info/data-migration.html
        schema: SCHEMA_V0,
      },
    });
  }

  public async addORUpdateData(option: IOptionsToolEntry) {
    try {
      //handles instertion and update as long as the name is the same.
      await this.dbCollection.incrementalUpsert(option);
    } catch (err) {
      alert('Failed to add data, please try again');
      console.error('option.submit(): error:');
      throw err;
    }
  }

  public async deleteOption(option: RxDocument<IOptionsToolEntry>) {
    await option.remove();
  }
}
