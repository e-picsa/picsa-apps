import { Injectable } from '@angular/core';
import { PicsaCustomCardService } from '@picsa/shared/features/cards';

import { BUDGET_CARDS, ENTERPRISE_GROUPS } from '../data';
import * as CardSchema from '../schema/cards';

@Injectable({ providedIn: 'root' })
export class BudgetCardService extends PicsaCustomCardService<CardSchema.IBudgetCard> {
  protected collectionName = 'budget_cards' as const;
  protected collectionCreator = CardSchema.COLLECTION;

  public enterpriseGroups = this.getEnterpriseGroupCards();

  constructor() {
    super();
    this.ready().then(() => console.log('[Budget Card] service ready'));
    // TODO - migrate legacy db custom cards (if possible)
  }

  public override async init() {
    await super.init();
    await this.loadHardcodedData();
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

  private async loadHardcodedData() {
    return this.dbCollection.bulkUpsert(BUDGET_CARDS);
  }
}
