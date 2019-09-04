import { Component, Input } from '@angular/core';
import {
  IBudgetPeriodData,
  IBudgetPeriodType
} from '../../models/budget-tool.models';
import { BudgetStore } from '../../store/budget.store';
import { Router, ActivatedRoute } from '@angular/router';
import { BUDGET_PERIOD_ROWS } from '../../store/templates';
import { toJS } from 'mobx';

@Component({
  selector: 'budget-period-summary',
  templateUrl: './period-summary.html',
  styleUrls: ['./period-summary.scss']
})
export class BudgetPeriodSummaryComponent {
  @Input() data: IBudgetPeriodData;
  @Input() periodIndex: number;
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

  constructor(
    private store: BudgetStore,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  ngOnInit(): void {
    console.log('data', toJS(this.data));
    this.periodLabels = this.store.budgetPeriodLabels;
    console.log('rows', this.rows);
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
