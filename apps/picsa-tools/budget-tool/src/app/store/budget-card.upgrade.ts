import * as CardSchema from '../schema/cards';

/** Legacy endpoint used to store custom cards before the 2023 RxDB migration */
export const LEGACY_CUSTOM_CARDS_ENDPOINT = 'budgetTool/_all/cards';

/** Only cards with `customMeta` were user-created; hardcoded seed cards never set it */
export function filterLegacyCustomCards(cards: CardSchema.IBudgetCard[]): CardSchema.IBudgetCard[] {
  return cards.filter((card) => !!card.customMeta);
}
