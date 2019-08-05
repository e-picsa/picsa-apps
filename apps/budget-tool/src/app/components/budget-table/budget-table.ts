import { Component, Input, OnInit } from '@angular/core';
import { Events } from '@ionic/angular';
import {
  IBudget,
  IBudgetPeriodType,
  IBudgetActiveCell,
  BUDGET_PERIOD_ROWS
} from '../../models/budget-tool.models';
import { BudgetStore } from '../../store/budget.store';

@Component({
  selector: 'budget-table',
  templateUrl: 'budget-table.html',
  styleUrls: ['./budget-table.scss']
})
export class BudgetTableComponent implements OnInit {
  @Input() budget: IBudget;
  rows: IBudgetRow[] = BUDGET_PERIOD_ROWS;
  columns: IBudgetColumn[] = [];
  dotsLegend = [];
  balance: any;

  constructor(public events: Events, private store: BudgetStore) {}
  ngOnInit(): void {
    this.dotsLegend = Object.entries(this.budget.dotValues);
    const periods = this.budget.periods.labels as string[];
    this.columns = periods.map(p => {
      return {
        key: p,
        label: p
      };
    });
    console.log('dots legend', this.dotsLegend);
  }

  onCellClick(
    row: IBudgetRow,
    rowIndex: number,
    column: IBudgetColumn,
    columnIndex: number
  ) {
    const activeCell: IBudgetActiveCell = {
      periodIndex: columnIndex,
      periodKey: column.key,
      periodLabel: column.label,
      typeIndex: rowIndex,
      typeKey: row.key,
      typeLabel: row.label
    };
    this.store.toggleEditor(activeCell);
  }
}

/********************************************************************************
 *      Interfaces and constants
 *******************************************************************************/

interface IBudgetRow {
  key: IBudgetPeriodType;
  label: string;
}
interface IBudgetColumn {
  key: string;
  label: string;
}
