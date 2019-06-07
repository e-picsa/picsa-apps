import { Component, Input, OnInit } from '@angular/core';
import { BudgetToolActions } from '../../store/budget-tool.actions';
import { ICustomBudgetCard } from '../../models/budget-tool.models';
import REGIONAL_SETTINGS from '@picsa/core/environments/region';
import { BudgetStore } from '../../store/budget.store';
import { MatFormFieldControl } from '@angular/material';

@Component({
  selector: 'picsa-budget-card',
  templateUrl: 'budget-card.html',
  providers: [
    { provide: MatFormFieldControl, useExisting: BudgetCardComponent }
  ]
})

// implement CVA so can be used in form and template bindings to pass back value
export class BudgetCardComponent implements OnInit {
  // use partial as not sure whether will be budget card or custom budget card
  @Input() card: Partial<ICustomBudgetCard>;
  @Input() type: string;
  // on click want to
  selected: boolean;
  currency = REGIONAL_SETTINGS.currency;

  constructor(public actions: BudgetToolActions, public store: BudgetStore) {}

  ngOnInit(): void {
    console.log('card init', this.card);
  }

  cardClicked() {
    // *** TODO - figure out what wanted handler to do
    console.log('card clicked');
  }
}
