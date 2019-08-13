import { Component, Input } from '@angular/core';
import { BudgetStore } from '../../../store/budget.store';
import { IBudgetValueCounters } from '../../../models/budget-tool.models';

@Component({
  selector: 'budget-balance-legend',
  templateUrl: './balance-legend.html',
  styleUrls: ['./balance-legend.scss']
})
export class BudgetBalanceLegendComponent {
  labels: string[];
  values: number[];
  constructor(private store: BudgetStore) {}
  @Input() set valueCounters(valueCounters: IBudgetValueCounters) {
    // only keep the even items (non-half values)
    this.labels = valueCounters[0].filter((v, i) => i % 2 === 0);
    this.values = valueCounters[1].filter((v, i) => i % 2 === 0);
  }

  ngOnInit(): void {
    console.log('value counteer legend', this.valueCounters);
  }

  scaleValues(scaleFactor: 0.1 | 10) {
    this.store.scaleValueCounters(scaleFactor);
  }
}
