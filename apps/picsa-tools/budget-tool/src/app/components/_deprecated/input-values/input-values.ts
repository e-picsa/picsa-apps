import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IBudgetCardWithValues } from '../../../models/budget-tool.models';
import { BudgetStore } from '../../../store/budget.store';

@Component({
  selector: 'budget-cell-editor-input-values',
  templateUrl: './input-values.html',
  styleUrls: ['./input-values.scss'],
})

/*  The budget cell editor sits on top of the budget table, so that when opened covers the table
 */
export class BudgetCellEditorInputValuesComponent {
  @Input() cards: IBudgetCardWithValues[];
  @Output() valueChanged = new EventEmitter<IBudgetCardWithValues[]>();
  currency: string;

  constructor(store: BudgetStore) {
    this.currency = store.settings.currency;
  }
  // using manual bindings instead of ngmodel as nested ngfor-ngmodel with matInput tricky
  setValue(e: Event, key: 'quantity' | 'cost', cardIndex: number) {
    const card = this.cards[cardIndex];
    const target = e.target as HTMLInputElement;
    card.values[key] = Number(target.value);
    if (card.values.quantity && card.values.cost) {
      card.values.total = card.values.quantity * card.values.cost;
    }
    this.cards[cardIndex] = card;
    console.log('cards', this.cards);
    this.valueChanged.emit(this.cards);
  }
}
