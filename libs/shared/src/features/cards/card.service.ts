import { inject } from '@angular/core';
import { RxCollection } from 'rxdb';

import { PicsaAsyncService } from '../../services/asyncService.service';
import { IPicsaCollectionCreator, PicsaDatabase_V2_Service } from '../../services/core/db_v2';
import { IDBCollectionName } from '../../services/core/db_v2/db.types';
import { IPicsaCustomCard } from './card.model';

/**
 * Base service for tools that support user-created custom cards (e.g. budget, seasonal calendar).
 * Handles RxDB collection registration and generic card CRUD.
 *
 * Tool-specific concerns (hardcoded card seeding, groupings, schema/migrations) are owned by the
 * subclass via `collectionName` and `collectionCreator`.
 */
export abstract class PicsaCustomCardService<T extends IPicsaCustomCard = IPicsaCustomCard> extends PicsaAsyncService {
  protected dbService = inject(PicsaDatabase_V2_Service);

  /** RxDB collection name, must be registered in `IDBCollectionName` */
  protected abstract collectionName: IDBCollectionName;
  /** Collection schema/migrations, owned by the consuming tool */
  protected abstract collectionCreator: IPicsaCollectionCreator<T>;

  public get dbCollection() {
    return this.dbService.db.collections[this.collectionName] as RxCollection<T>;
  }

  public override async init() {
    await this.dbService.ready();
    await this.dbService.ensureCollections({
      [this.collectionName]: this.collectionCreator,
    } as Record<IDBCollectionName, IPicsaCollectionCreator<any>>);
  }

  public async saveCustomCard(card: T) {
    return this.dbCollection.upsert(card);
  }

  public async deleteCustomCard(card: T) {
    const ref = this.dbCollection.findOne(card.id);
    return ref.remove();
  }
}
