import { Component, Input } from '@angular/core';
import { Events } from '@ionic/angular';
import {
  IBudgetCard,
  IBudgetPeriodData
} from '../../models/budget-tool.models';

@Component({
  selector: 'budget-cell',
  templateUrl: './cell.html',
  styleUrls: ['./cell.scss']
})
export class BudgetCellComponent {
  @Input('periodIndex') periodIndex: number;
  @Input('rowLabel') rowLabel: string;
  @Input('type') type: string;
  @Input('typeLabel') typeLabel: string;
  @Input()
  set cellData(d: IBudgetPeriodData) {
    this.cellDataUpdated(d);
  }
  _oldCellData: any = [];
  _cellData: IBudgetCard[];

  constructor(private events: Events) {}

  public onCellClick() {
    // use both events and redux as redux alone fails to trigger uipdate when period index changed
    // but type remains (e.g. activity 1 => activity 2)
    // listened to by card-list component
    this.events.publish('cell:selected', {
      type: this.type,
      periodIndex: this.periodIndex,
      title: `${this.rowLabel} ${this.typeLabel}`
    });
  }

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
    console.log('cell data set', cards);
  }
}
