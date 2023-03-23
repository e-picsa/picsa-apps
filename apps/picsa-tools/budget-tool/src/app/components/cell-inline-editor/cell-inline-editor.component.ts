import { Component, Input } from '@angular/core';
import {
  FadeInOut,
  ANIMATION_DELAYED,
  FlyInOut,
} from '@picsa/shared/animations';
import {
  IBudgetCard,
  IBudgetCardWithValues,
  IBudgetPeriodData,
  IBudgetPeriodType,
} from '../../models/budget-tool.models';
import { BudgetStore } from '../../store/budget.store';

@Component({
  selector: 'budget-cell-inline-editor',
  templateUrl: './cell-inline-editor.component.html',
  styleUrls: ['./cell-inline-editor.component.scss'],
  animations: [FadeInOut(ANIMATION_DELAYED), FlyInOut({ axis: 'Y' })],
})
export class BudgetCellInlineEditorComponent {
  // steps = EDITOR_STEPS;
  public data: IBudgetPeriodData;
  public selected: IBudgetCardWithValues[] = [];
  public _activeType: IBudgetPeriodType;
  public _activePeriod: number;

  public showCardsList = false;

  @Input() set activeType(activeType: IBudgetPeriodType) {
    this._activeType = activeType;
    this.loadEditorData();
  }
  @Input() set activePeriod(activePeriod: number) {
    this._activePeriod = activePeriod;
    this.loadEditorData();
  }

  @Input() isOpen = false;
  constructor(public store: BudgetStore) {}

  public toggleCardList() {}

  private loadEditorData() {
    if (this._activePeriod !== undefined && this._activeType !== undefined) {
      // create copy of data to avoid first input populating multiple activities
      const data: IBudgetPeriodData = JSON.parse(
        JSON.stringify(this.store.activeBudget.data[this._activePeriod])
      );
      this.data = data;
      this.selected = data[this._activeType] || [];
    }
  }

  public trackByFn(index: number, item: IBudgetCard) {
    return item.id;
  }

  public removeSelectedCard(index: number) {
    if (this.data[this._activeType][index]) {
      const values = [...this.data[this._activeType]];
      values.splice(index, 1);

      this.onEditorChange(values, this._activeType);
      this.loadEditorData();
    }
  }

  // setActiveStep(type: IBudgetPeriodType) {
  //   const index = EDITOR_STEPS.indexOf(type);
  //   // this.stepper.selectedIndex = index;
  // }

  // the store already knows what period and type it is, so just pass the updated values
  // back up to save
  onEditorChange(values: IBudgetCardWithValues[], type: IBudgetPeriodType) {
    this.store.saveEditor(values, type);
  }

  // // as can't easily prevent default step click behaviour, instead add extra call to update
  // // query params after
  // stepChange(e: StepperSelectionEvent) {
  //   const step = EDITOR_STEPS[e.selectedIndex];
  //   // as can't disable stepper slide animation use timeout to delay other animations
  //   this.router.navigate([], {
  //     relativeTo: this.route,
  //     queryParams: {
  //       type: step,
  //     },
  //     replaceUrl: true,
  //     queryParamsHandling: 'merge',
  //   });
  // }

  // closeEditor() {
  //   this.router.navigate([], {
  //     relativeTo: this.route,
  //   });
  // }
}

// const EDITOR_STEPS: (IBudgetPeriodType | 'summary')[] = [
//   'activities',
//   'inputs',
//   'familyLabour',
//   'outputs',
//   'produceConsumed',
//   'summary',
// ];
