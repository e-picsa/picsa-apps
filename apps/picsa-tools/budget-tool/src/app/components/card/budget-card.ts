import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { IBudgetCard } from '../../schema';
import { BudgetStore } from '../../store/budget.store';

@Component({
  selector: 'budget-card',
  templateUrl: 'budget-card.html',
  styleUrls: ['budget-card.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

// implement CVA so can be used in form and template bindings to pass back value
export class BudgetCardComponent {
  // use partial as not sure whether will be budget card or custom budget card
  @Input() card: IBudgetCard;
  @Input() selected: boolean;

  constructor(public store: BudgetStore) {}
}
