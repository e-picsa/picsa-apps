import { Component, OnInit } from '@angular/core';
import { BudgetStore } from '../../../store/budget.store';
import { ENVIRONMENT } from '@picsa/environments';
import { IBudgetValueScale } from '../../../models/budget-tool.models';

@Component({
  selector: 'budget-balance-dots',
  templateUrl: './balance-dots.html',
  styleUrls: ['./balance-dots.scss']
})

// implement CVA so can be used in form and template bindings to pass back value
export class BudgetBalanceDotsComponent implements OnInit {
  dotsLegend = [];
  currentScale: IBudgetValueScale;
  constructor(private store: BudgetStore) {}
  ngOnInit(): void {
    this.currentScale = this.store.activeBudget.meta.valueScale;
    this.getDotLegend();
  }

  scaleValues(scaleFactor: 10 | 0.1) {
    this.currentScale = (this.currentScale * scaleFactor) as IBudgetValueScale;
    this.store.patchBudget({
      meta: { ...this.store.activeBudget.meta, valueScale: this.currentScale }
    });
    this.getDotLegend();
  }

  getDotLegend() {
    const dots = ENVIRONMENT.region.currencyCounters;
    this.dotsLegend = Object.keys(dots).map(k => [
      k,
      dots[k] * this.currentScale
    ]);
  }
}
