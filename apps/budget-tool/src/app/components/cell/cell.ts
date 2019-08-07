import { Component, Input } from '@angular/core';
import {
  IBudgetCard,
  IBudgetPeriodData
} from '../../models/budget-tool.models';
import { BudgetStore } from '../../store/budget.store';

@Component({
  selector: 'budget-cell',
  templateUrl: './cell.html',
  styleUrls: ['./cell.scss']
})
export class BudgetCellComponent {
  @Input('type') type: string;
  @Input()
  set cellData(d: IBudgetPeriodData) {
    this.cellDataUpdated(d);
  }
  _oldCellData: any = [];
  _cellData: IBudgetCard[];

  constructor(public store: BudgetStore) {}

  private cellDataUpdated(cellData: IBudgetPeriodData) {
    // as budget refreshed often only want to re-render when change so keep track of old data
    // and compare json objects using simple tostring method
    // *** still not optimal, but would have to avoid to level bindings to remove so
    // assumed best solution for now
    if (cellData && cellData.toString() != this._oldCellData.toString()) {
      this.setCellData(cellData);
      this._oldCellData = cellData;
    }
  }

  private setCellData(data: IBudgetPeriodData) {
    const cards = Object.values(data);
    if (cards.length > 0) {
      this._cellData = cards;
    } else {
      // empty should be treated as null (cell has been entered but no data selected)
      this._cellData = null;
    }
  }
}
