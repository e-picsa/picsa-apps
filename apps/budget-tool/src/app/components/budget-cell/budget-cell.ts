import { NgRedux } from "@angular-redux/store";
import { Component, Input } from "@angular/core";
import { Events } from "@ionic/angular";
import { IBudgetCard, IBudgetPeriodData } from "../../models/budget-tool.models";

@Component({
  selector: "budget-cell",
  templateUrl: "budget-cell.html"
})
export class BudgetCellComponent {
  @Input("periodIndex") periodIndex: number;
  @Input("rowLabel") rowLabel: string;
  @Input("type") type: string;
  @Input("typeLabel") typeLabel: string;
  @Input()
  set cellData(cellData: IBudgetPeriodData) {
    // as budget refreshed often only want to re-render when change so keep track of old data
    // to confuse further alternates
    // and compare json objects using simple tostring method
    // *** still not optimal, would be better to resolve budget repopulation issues
    if (cellData && cellData.toString() != this._oldCellData.toString()) {
      this._oldCellData = cellData;
      this.setCellData(cellData);
    }
  }
  _oldCellData: any = [];
  _cellData: IBudgetCard[];

  constructor(private events: Events) {}

  shouldSetCellData(cellData) {
    return (
      cellData &&
      cellData.length > 0 &&
      cellData.toString != this._oldCellData.toString()
    );
  }

  setCellData(data: IBudgetPeriodData) {
    const cards = _jsonObjectValues(data);
    if (cards.length > 0) {
      this._cellData = cards;
    } else {
      // empty should be treated as null (cell has been entered but no data selected)
      this._cellData = null;
    }
    console.log("cell data set", cards);
  }

  editCell() {
    // use both events and redux as redux alone fails to trigger uipdate when period index changed
    // but type remains (e.g. activity 1 => activity 2)
    // listened to by card-list component
    this.events.publish("cell:selected", {
      type: this.type,
      periodIndex: this.periodIndex,
      title: `${this.rowLabel} ${this.typeLabel}`
    });
  }
}

function _jsonObjectValues(json: any) {
  const values = [];
  for (const key in json) {
    if (json.hasOwnProperty(key)) {
      values.push(json[key]);
    }
  }
  return values;
}
