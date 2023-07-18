import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BudgetCardService } from '@picsa/budget/src/app/store/budget-card.service';

import { IBudgetCardWithValues } from '../../../../schema';
import { BudgetStore } from '../../../../store/budget.store';

@Component({
  selector: 'budget-cell-editor-produce-consumed',
  templateUrl: './produce-consumed.html',
  styleUrls: ['./produce-consumed.scss'],
})

/*  The budget cell editor sits on top of the budget table, so that when opened covers the table
 */
export class BudgetCellEditorProduceConsumedComponent implements OnInit {
  // Legacy version
  @Input() cards: IBudgetCardWithValues[] = [];

  @Output() valueChanged = new EventEmitter<IBudgetCardWithValues[]>();

  public totalOutputs: Record<string, number>;
  public totalConsumed: Record<string, number>;

  constructor(private store: BudgetStore, private cardService: BudgetCardService) {}

  async ngOnInit() {
    const { cards } = await this.generateProduceConsumedCards();
    this.cards = cards;
  }

  /**
   * Generate a list of cards to be used for produce consumed selection
   * The list restricts to only cards that have had outputs produced within
   * the active period, and tracks total quanitities available/consumed
   */
  private async generateProduceConsumedCards() {
    const allBudgetPeriods = this.store.activeBudget.data || [];

    // Extract values for any existing produce consumed values
    const periodConsumed: Record<string, number> = {};
    const currentPeriodData = allBudgetPeriods[this.store.activePeriod];
    for (const card of currentPeriodData.produceConsumed) {
      // HACK - Legacy formatting stored consumed quantity at top-level and not within values
      const legacyQuantity = card['quantity' as string];
      if (legacyQuantity) card.values = { quantity: legacyQuantity, cost: 0, total: 0 };
      periodConsumed[card.id] = card.values.quantity || 0;
    }

    this.totalOutputs = this.calcTotalOutputs();
    this.totalConsumed = this.calcTotalConsumed();

    // Create a list of produceConsumed cards from list of output card, including only those
    // that have had outputs produced and assigned with existing period values
    const docs = await this.cardService.dbCollection.find({ selector: { type: 'outputs' } }).exec();

    const cards = docs
      .map((d) => d._data)
      .filter(({ id }) => id in this.totalOutputs && id !== 'money')
      .map((c) => {
        const card = c as IBudgetCardWithValues;
        card.type = 'produceConsumed';
        card.values = { quantity: periodConsumed[c.id] || 0, cost: 0, total: 0 };
        return card;
      });

    return { cards };
  }

  private calcTotalOutputs() {
    const allBudgetPeriods = this.store.activeBudget.data || [];
    // sum all quantities of all outputs up to current period and store in a list
    // TODO - could also track totalConsumed and use for data validation
    const totalOutputs: Record<string, number> = {};
    const consumablePeriods = allBudgetPeriods.filter((_, i) => i <= this.store.activePeriod);
    for (const { outputs } of consumablePeriods) {
      for (const card of outputs) {
        totalOutputs[card.id] ??= 0;
        totalOutputs[card.id] += card.values.quantity;
      }
    }
    return totalOutputs;
  }

  private calcTotalConsumed() {
    const allBudgetPeriods = this.store.activeBudget.data || [];
    // sum all quantities of all outputs up to current period and store in a list
    // TODO - could also track totalConsumed and use for data validation
    const totalOutputs: Record<string, number> = {};
    const consumablePeriods = allBudgetPeriods.filter((_, i) => i <= this.store.activePeriod);
    for (const { produceConsumed } of consumablePeriods) {
      for (const card of produceConsumed) {
        // HACK - Legacy formatting stored consumed quantity at top-level and not within values
        const legacyQuantity = card['quantity' as string];
        if (legacyQuantity) card.values = { quantity: legacyQuantity, cost: 0, total: 0 };
        totalOutputs[card.id] ??= 0;
        totalOutputs[card.id] += card.values.quantity;
      }
    }
    return totalOutputs;
  }

  // using manual bindings instead of ngmodel as nested ngfor-ngmodel with matInput tricky
  setValue(e: Event, cardIndex: number) {
    const card = this.cards[cardIndex];
    const target = e.target as HTMLInputElement;
    card.values.quantity = Number(target.value);
    this.cards[cardIndex] = card;
    // only emit cards with quantities specified
    const consumedCards = this.cards.filter((c) => c.values.quantity);
    this.valueChanged.emit(consumedCards);
    this.generateProduceConsumedCards();
  }
}
