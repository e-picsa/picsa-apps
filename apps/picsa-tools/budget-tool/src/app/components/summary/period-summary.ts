import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { BudgetStore } from '../../store/budget.store';
import { BUDGET_PERIOD_ROWS, IBudgetPeriodRow } from '../../store/templates';

@Component({
  selector: 'budget-period-summary',
  templateUrl: './period-summary.html',
  styleUrls: ['./period-summary.scss'],
})
export class BudgetPeriodSummaryComponent {
  @Input() periodIndex: number;
  rows = BUDGET_PERIOD_ROWS;

  constructor(public store: BudgetStore, private router: Router, private route: ActivatedRoute) {}

  onCellClick(row: IBudgetPeriodRow) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        type: row.type,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
