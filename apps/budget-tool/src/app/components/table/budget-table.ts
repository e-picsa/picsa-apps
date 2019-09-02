import { Component, Input, OnInit } from '@angular/core';
import {
  IBudget,
  IBudgetPeriodType,
  IBudgetActiveCell
} from '../../models/budget-tool.models';
import { BudgetStore } from '../../store/budget.store';
import { BUDGET_PERIOD_ROWS } from '../../store/templates';

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

  constructor(private store: BudgetStore) {}
  ngOnInit(): void {
    this.periodLabels = this.store.budgetPeriodLabels;
    console.log('labels', this.periodLabels);
  }

  onCellClick(columnIndex: number, row: IBudgetRow) {
    const cell: IBudgetActiveCell = {
      periodIndex: columnIndex,
      periodLabel: this.periodLabels[columnIndex],
      typeKey: row.key,
      typeLabel: row.label,
      // cell data will be populated by the store
      cellData: []
    };
    this.store.setActiveCell(cell);
  }
}

/********************************************************************************
 *      Interfaces and constants
 *******************************************************************************/

interface IBudgetRow {
  key: IBudgetPeriodType;
  label: string;
}
