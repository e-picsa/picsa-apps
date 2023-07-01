import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { IBudgetPeriodType } from '../../models/budget-tool.models';
import { BudgetStore } from '../../store/budget.store';
import { BUDGET_PERIOD_ROWS } from '../../store/templates';

@Component({
  selector: 'budget-period-summary',
  templateUrl: './period-summary.html',
  styleUrls: ['./period-summary.scss'],
})
export class BudgetPeriodSummaryComponent {
  @Input() periodIndex: number;
  rows: IBudgetRow[] = Object.keys(BUDGET_PERIOD_ROWS).map((key) => {
    const label = BUDGET_PERIOD_ROWS[key];
    return {
      key: key as IBudgetPeriodType,
      label,
    };
  });

  constructor(public store: BudgetStore, private router: Router, private route: ActivatedRoute) {}

  onCellClick(row: IBudgetRow) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        type: row.key,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}

/********************************************************************************
 *      Interfaces and constants
 *******************************************************************************/

interface IBudgetRow {
  key: IBudgetPeriodType;
  label: string;
}
