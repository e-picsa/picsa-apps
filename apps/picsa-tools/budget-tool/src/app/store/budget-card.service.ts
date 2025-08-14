import { Injectable } from '@angular/core';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { PicsaDatabase_V2_Service } from '@picsa/shared/services/core/db_v2';
import { RxCollection } from 'rxdb';

import { BUDGET_CARDS, ENTERPRISE_GROUPS } from '../data';
import * as CardSchema from '../schema/cards';

@Injectable({ providedIn: 'root' })
export class BudgetCardService extends PicsaAsyncService {
  public enterpriseGroups = this.getEnterpriseGroupCards();

  constructor(private dbService: PicsaDatabase_V2_Service) {
    super();
    this.ready().then(() => console.log('[Budget Card] service ready'));
    // TODO - migrate legacy db custom cards (if possible)
  }

  public override async init() {
    await this.dbService.ready();
    await this.dbService.ensureCollections({
      budget_cards: CardSchema.COLLECTION,
    });
    await this.loadHardcodedData();
  }

  public get dbCollection() {
    return this.dbService.db.collections.budget_cards as RxCollection<CardSchema.IBudgetCard>;
  }

  private getEnterpriseGroupCards(): CardSchema.IBudgetCard[] {
    return Object.keys(ENTERPRISE_GROUPS).map((group) => ({
      id: group,
      label: group,
      type: 'enterprise',
      imgType: 'svg',
      _key: `_group_${group}`,
      _created: new Date().toISOString(),
      _modified: new Date().toISOString(),
    }));
  }

  public async saveCustomCard(card: CardSchema.IBudgetCard) {
    return this.dbCollection.upsert(card);
  }
  public async deleteCustomCard(card: CardSchema.IBudgetCard) {
    const ref = this.dbCollection.findOne(card.id);
    return ref.remove();
  }

  private async loadHardcodedData() {
    return this.dbCollection.bulkUpsert(BUDGET_CARDS);
  }
}
