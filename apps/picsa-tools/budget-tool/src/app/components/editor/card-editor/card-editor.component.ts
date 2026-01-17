import { Component, EventEmitter, inject,Input, Output } from '@angular/core';

import { IBudgetPeriodType } from '../../../models/budget-tool.models';
import { IBudgetCardWithValues } from '../../../schema';
import { BudgetStore } from '../../../store/budget.store';

@Component({
  selector: 'budget-card-editor',
  templateUrl: './card-editor.component.html',
  styleUrls: ['./card-editor.component.scss'],
  standalone: false,
})
export class BudgetCardEditorComponent {
  store = inject(BudgetStore);

  currency: string;
  @Input() card: IBudgetCardWithValues;
  @Input() type: IBudgetPeriodType;
  @Output() deleteClicked = new EventEmitter<IBudgetCardWithValues>();
  @Output() valueChanged = new EventEmitter<IBudgetCardWithValues>();

  constructor() {
    this.currency = this.store.settings.currency;
  }

  // using manual bindings instead of ngmodel as nested ngfor-ngmodel with matInput tricky
  setValue(e: Event, key: 'quantity' | 'cost') {
    const target = e.target as HTMLInputElement;
    this.card.values[key] = Number(target.value);
    if (this.card.values.quantity && this.card.values.cost) {
      this.card.values.total = this.card.values.quantity * this.card.values.cost;
    }
    this.valueChanged.emit(this.card);
  }

  // HACK - produceConsumed only populates quanityt, not values or cost
  setProduceConsumed(e: Event) {
    const target = e.target as HTMLInputElement;
    this.card.values = { quantity: Number(target.value), cost: 0, total: 0 };
    this.valueChanged.emit(this.card);
  }
}
