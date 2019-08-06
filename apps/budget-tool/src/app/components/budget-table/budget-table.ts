import { Component, Input, OnInit } from '@angular/core';
import { Events } from '@ionic/angular';
import {
  IBudget,
  IBudgetPeriodType,
  IBudgetActiveCell
} from '../../models/budget-tool.models';
import { BudgetStore } from '../../store/budget.store';
import { BUDGET_PERIOD_ROWS } from '../../store/templates';
import { ENVIRONMENT } from '@picsa/environments';

@Component({
  selector: 'budget-table',
  templateUrl: 'budget-table.html',
  styleUrls: ['./budget-table.scss']
})
export class BudgetTableComponent implements OnInit {
  @Input() budget: IBudget;
  rows: IBudgetRow[] = BUDGET_PERIOD_ROWS;
  dotsLegend = [];
  balance: any;

  constructor(private store: BudgetStore) {}
  ngOnInit(): void {
    this.dotsLegend = this._getDotLegend();
  }

  onCellClick(columnIndex: number, row: IBudgetRow) {
    const activeCell: IBudgetActiveCell = {
      periodIndex: columnIndex,
      typeKey: row.key
    };
    this.store.toggleEditor(activeCell);
  }

  _getDotLegend() {
    const dots = ENVIRONMENT.region.currencyCounters;
    const multiplier: number = this.budget.meta.valueScale;
    return Object.keys(dots).map(k => [k, dots[k] * multiplier]);
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
