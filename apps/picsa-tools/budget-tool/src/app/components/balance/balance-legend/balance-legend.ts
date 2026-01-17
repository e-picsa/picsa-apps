import { Component, inject,Input } from '@angular/core';

import { IBudgetValueCounters } from '../../../models/budget-tool.models';
import { BudgetStore } from '../../../store/budget.store';

@Component({
  selector: 'budget-balance-legend',
  templateUrl: './balance-legend.html',
  styleUrls: ['./balance-legend.scss'],
  standalone: false,
})
export class BudgetBalanceLegendComponent {
  store = inject(BudgetStore);

  labels: string[] = [];
  values: number[] = [];
  @Input() set valueCounters(valueCounters: IBudgetValueCounters) {
    if (valueCounters) {
      // only keep the even items (non-half values)
      this.labels = valueCounters[0].filter((v, i) => i % 2 === 0);
      this.values = valueCounters[1].filter((v, i) => i % 2 === 0);
    }
  }

  scaleValues(scaleFactor: 0.1 | 10) {
    this.store.scaleValueCounters(scaleFactor);
  }
}
