import { Component, Input, OnInit } from '@angular/core';
import { IBudget, IBudgetPeriodType } from '../../models/budget-tool.models';
import { BudgetStore } from '../../store/budget.store';
import { BUDGET_PERIOD_ROWS } from '../../store/templates';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'budget-table',
  templateUrl: 'budget-table.html',
  styleUrls: ['./budget-table.scss']
})
export class BudgetTableComponent implements OnInit {
  @Input() budget: IBudget;
  periodLabels: string[] = [];
  rows: IBudgetRow[] = Object.keys(BUDGET_PERIOD_ROWS).map(
    (key: IBudgetPeriodType) => {
      const label = BUDGET_PERIOD_ROWS[key];
      return {
        key,
        label
      };
    }
  );
  // TODO - bring back balance and refactor to own component
  balance: any;

  constructor(
    private store: BudgetStore,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  ngOnInit(): void {
    this.periodLabels = this.store.budgetPeriodLabels;
  }

  onCellClick(columnIndex: number, row: IBudgetRow) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        edit: true,
        period: columnIndex,
        label: this.periodLabels[columnIndex],
        type: row.key
      }
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
