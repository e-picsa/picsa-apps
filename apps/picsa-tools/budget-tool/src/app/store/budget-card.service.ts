import { inject, Injectable } from '@angular/core';
import { IAppMeta } from '@picsa/models';
import { PicsaCustomCardService } from '@picsa/shared/features/cards';
import { PicsaDbService } from '@picsa/shared/services/core/db';

import { BUDGET_CARDS, ENTERPRISE_GROUPS } from '../data';
import * as CardSchema from '../schema/cards';
import { filterLegacyCustomCards, LEGACY_CUSTOM_CARDS_ENDPOINT } from './budget-card.upgrade';

@Injectable({ providedIn: 'root' })
export class BudgetCardService extends PicsaCustomCardService<CardSchema.IBudgetCard> {
  protected collectionName = 'budget_cards' as const;
  protected collectionCreator = CardSchema.COLLECTION;

  private legacyDb = inject(PicsaDbService);

  public enterpriseGroups = this.getEnterpriseGroupCards();

  constructor() {
    super();
    this.ready().then(() => console.log('[Budget Card] service ready'));
  }

  public override async init() {
    await super.init();
    await this.loadHardcodedData();
    await this.migrateLegacyCustomCardsOnce();
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

  /**
   * One-time migration of custom cards saved through the legacy PicsaDbService
   * Guarded by an `_appMeta` flag so the legacy store is only ever read once per device.
   */
  private async migrateLegacyCustomCardsOnce() {
    const migrated = await this.legacyDb.getDoc<IAppMeta>('_appMeta', 'BUDGET_CARDS_LEGACY_MIGRATED');
    if (migrated) return;

    const legacyCards = await this.legacyDb.getCollection<CardSchema.IBudgetCard>(LEGACY_CUSTOM_CARDS_ENDPOINT);
    const customCards = filterLegacyCustomCards(legacyCards);
    if (customCards.length > 0) {
      await this.dbCollection.bulkUpsert(customCards);
      console.log(`[Budget Card] migrated ${customCards.length} legacy custom card(s) to RxDB`);
    }
    await this.legacyDb.setDoc('_appMeta', {
      _key: 'BUDGET_CARDS_LEGACY_MIGRATED',
      value: new Date().toISOString(),
    });
  }
}
