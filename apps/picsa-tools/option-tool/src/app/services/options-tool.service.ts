import { Injectable } from '@angular/core';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { PicsaDatabase_V2_Service } from '@picsa/shared/services/core/db_v2';
import { PrintProvider } from '@picsa/shared/services/native';
import { RxCollection, RxDocument } from 'rxdb';

import { COLLECTION, IOptionsToolEntry } from '../schemas';

@Injectable({ providedIn: 'root' })
export class OptionsToolService extends PicsaAsyncService {
  constructor(private dbService: PicsaDatabase_V2_Service, private printPrvdr: PrintProvider) {
    super();
  }

  /** Provide database options tool collection (with typings) */
  public get dbCollection() {
    return this.dbService.db.collections['options_tool'] as RxCollection<IOptionsToolEntry>;
  }
  /** Provide database options tool collection filtered to active user */
  public get dbUserCollection() {
    return this.dbService.activeUserQuery(this.dbCollection).sort({ _created_at: 'desc' });
  }

  /** Initialise collection required for storing data to database */
  public override async init() {
    await this.dbService.ensureCollections({
      options_tool: COLLECTION,
    });
  }

  public async addORUpdateData(option: IOptionsToolEntry) {
    try {
      //handles instertion and update as long as the name is the same.
      const res = await this.dbCollection.incrementalUpsert(option);
      console.log('[Option]', res._data);
    } catch (err) {
      alert('Failed to add data, please try again');
      console.error('option.submit(): error:');
      throw err;
    }
  }

  public async deleteOption(option: RxDocument<IOptionsToolEntry>) {
    await option.remove();
  }

  public async shareAsImage() {
    return this.printPrvdr.shareHtmlDom('#options', 'Options', 'PICSA - Options');
  }
}
