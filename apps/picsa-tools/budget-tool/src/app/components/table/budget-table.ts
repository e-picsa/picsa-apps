import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { IBudget, IBudgetPeriodType } from '../../models/budget-tool.models';
import { BudgetStore } from '../../store/budget.store';
import { BUDGET_PERIOD_ROWS } from '../../store/templates';

@Component({
  selector: 'budget-table',
  templateUrl: 'budget-table.html',
  styleUrls: ['./budget-table.scss'],
})
export class BudgetTableComponent {
  @Input() budget: IBudget;
  periodLabels: string[] = [];
  rows: IBudgetRow[] = Object.keys(BUDGET_PERIOD_ROWS).map((key) => {
    const label = BUDGET_PERIOD_ROWS[key];
    return {
      key: key as IBudgetPeriodType,
      label,
    };
  });
  // TODO - bring back balance and refactor to own component
  balance: any;

  constructor(public store: BudgetStore, private router: Router, private route: ActivatedRoute) {}

  onCellClick(columnIndex: number, row: IBudgetRow) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        edit: true,
        period: columnIndex,
        label: this.periodLabels[columnIndex],
        type: row.key,
      },
      // just to make explicit, when navigating from main budget page want to keep history
      // to go back to full budget. This is different than once in editor
      replaceUrl: false,
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
