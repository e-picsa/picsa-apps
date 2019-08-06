import { Component, Input, OnInit } from '@angular/core';
import { Events } from '@ionic/angular';
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
  rows: IBudgetRow[] = BUDGET_PERIOD_ROWS;
  // TODO - bring back balance and refactor to own component
  balance: any;

  constructor(private store: BudgetStore) {}
  ngOnInit(): void {}

  onCellClick(columnIndex: number, row: IBudgetRow) {
    const activeCell: IBudgetActiveCell = {
      periodIndex: columnIndex,
      typeKey: row.key
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
