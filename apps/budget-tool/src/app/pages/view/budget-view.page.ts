import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BudgetStore } from '../../store/budget.store';
import {
  FadeInOut,
  OpenClosed,
  FlyInOut,
  ANIMATION_DEFAULTS
} from '@picsa/animations';

@Component({
  selector: 'budget-view',
  templateUrl: './budget-view.page.html',
  styleUrls: ['./budget-view.page.scss'],
  animations: [
    FadeInOut({
      ...ANIMATION_DEFAULTS,
      ...{ inSpeed: 200, inDelay: 500, outSpeed: 100, outDelay: 0 }
    }),
    OpenClosed,
    FlyInOut({
      ...ANIMATION_DEFAULTS,
      ...{ axis: 'Y', outSpeed: 300 }
    })
  ]
})
export class BudgetViewPage implements OnInit {
  loader: HTMLIonLoadingElement;

  constructor(private route: ActivatedRoute, private store: BudgetStore) {}

  ngOnInit() {
    this.loadBudget();
  }

  async loadBudget() {
    const budgetKey = this.route.snapshot.params.budgetKey;
    this.store.loadBudgetByKey(budgetKey);
  }
}
