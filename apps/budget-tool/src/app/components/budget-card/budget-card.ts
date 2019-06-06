import { Component, Input } from '@angular/core';
import { BudgetToolActions } from '../../store/budget-tool.actions';
import { ICustomBudgetCard } from '../../models/budget-tool.models';
import REGIONAL_SETTINGS from '@picsa/core/environments/region';

@Component({
  selector: 'picsa-budget-card',
  templateUrl: 'budget-card.html'
})
export class BudgetCardComponent {
  // use partial as not sure whether will be budget card or custom budget card
  @Input() card: Partial<ICustomBudgetCard>;
  @Input() type: string;
  selected: boolean;
  currency = REGIONAL_SETTINGS.currency;

  constructor(public actions: BudgetToolActions) {}

  cardClicked() {
    // *** TODO - figure out what wanted handler to do
    console.log('card clicked');
  }
}
