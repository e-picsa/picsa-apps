import { Injectable } from '@angular/core';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { PicsaDatabase_V2_Service } from '@picsa/shared/services/core/db_v2';
import { RxCollection } from 'rxdb';

import { BUDGET_CARDS } from '../data';
import * as CardSchema from '../schema/cards';

const COLLECTION_NAME = 'budget_cards';

@Injectable({ providedIn: 'root' })
export class BudgetCardService extends PicsaAsyncService {
  constructor(private dbService: PicsaDatabase_V2_Service) {
    super();
    this.ready().then(() => console.log('[Budget Card] service ready'));
  }

  public override async init() {
    await this.dbService.ready();
    await this.dbService.ensureCollections({
      [COLLECTION_NAME]: CardSchema.COLLECTION,
    });
    await this.loadHardcodedData();
  }

  public get dbCollection() {
    return this.dbService.db.collections[COLLECTION_NAME] as RxCollection<CardSchema.IBudgetCard>;
  }

  public async getEnterpriseGroupCards() {
    await this.ready();
    const docs = await this.dbCollection.find({ selector: { type: 'enterprise' } }).exec();
    const cards = docs.map((d) => d._data);
    const groups = this.groupEnterpriseCards(cards);
    console.log({ groups });
    return groups;
  }

  public async saveCustomCard(card: CardSchema.IBudgetCard) {
    // await this.db.setDoc('budgetTool/_all/cards', card);
    // // re-populate budget cards
    // console.log('card saved', card);
  }
  public async deleteCustomCard(card: CardSchema.IBudgetCard) {
    // return this.db.deleteDocs('budgetTool/_all/cards', [card._key]);
  }

  private async loadHardcodedData() {
    return this.dbCollection.bulkUpsert(BUDGET_CARDS);
  }

  /**
   * group all enterprise cards and create new parent card that will be used to reveal group
   * @param cards
   * @returns
   */
  private groupEnterpriseCards(cards: CardSchema.IBudgetCard[]): CardSchema.IBudgetCard[] {
    const allGroupings: string[][] = cards.map((e) => e.groupings as string[]);
    // eslint-disable-next-line prefer-spread
    const mergedGroupings: string[] = ([] as any).concat.apply([], allGroupings);
    // NOTE - technically Array.from shouldn't be required but current issue with typescript
    // see https://stackoverflow.com/questions/33464504/using-spread-syntax-and-new-set-with-typescript/33464709
    const uniqueGroups = [...Array.from(new Set(mergedGroupings))].sort();
    const enterpriseTypeCards: CardSchema.IBudgetCard[] = uniqueGroups.map((group) => {
      return {
        id: group,
        label: group,
        type: 'enterprise',
        imgType: 'svg',
        _key: `_group_${group}`,
        _created: new Date().toISOString(),
        _modified: new Date().toISOString(),
      };
    });
    return enterpriseTypeCards;
  }
}
