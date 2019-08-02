import { Component, Input, OnInit } from '@angular/core';
import { BudgetToolActions } from '../../store/budget-tool.actions';
import {
  ICustomBudgetCard,
  IBudgetCard
} from '../../models/budget-tool.models';
import { BudgetStore } from '../../store/budget.store';
import { ENVIRONMENT } from '@picsa/environments';

@Component({
  selector: 'budget-card',
  templateUrl: 'budget-card.html',
  styleUrls: ['budget-card.scss']
})

// implement CVA so can be used in form and template bindings to pass back value
export class BudgetCardComponent implements OnInit {
  // use partial as not sure whether will be budget card or custom budget card
  @Input() card: Partial<ICustomBudgetCard>;
  @Input() generator: string;
  @Input() type: string;
  @Input() selected: boolean;
  currency = ENVIRONMENT.region.currency;

  constructor(public actions: BudgetToolActions, public store: BudgetStore) {}

  ngOnInit(): void {
    if (this.generator) {
      this.card = this.generateCard(this.generator);
    }
  }

  // if not passing full details (e.g. just enterprise type) create a basic card
  private generateCard(id: string): IBudgetCard {
    return {
      id: id,
      name: id
    };
  }

  cardClicked() {
    // *** TODO - figure out what wanted handler to do
  }
}
