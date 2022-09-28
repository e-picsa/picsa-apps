import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FadeInOut, ANIMATION_DELAYED } from '@picsa/shared/animations';
import {
  IBudgetCardWithValues,
  IBudgetPeriodData,
  IBudgetPeriodType,
} from '../../models/budget-tool.models';
import { BudgetStore } from '../../store/budget.store';

@Component({
  selector: 'budget-cell-inline-editor',
  templateUrl: './cell-inline-editor.component.html',
  styleUrls: ['./cell-inline-editor.component.scss'],
  animations: [FadeInOut(ANIMATION_DELAYED)],
})
export class BudgetCellInlineEditorComponent {
  // steps = EDITOR_STEPS;
  data: IBudgetPeriodData;
  selected: IBudgetCardWithValues[] = [];
  public _activeType: IBudgetPeriodType;
  public _activePeriod: number;
  @Input() set activeType(activeType: IBudgetPeriodType) {
    this._activeType = activeType;
    this.loadEditorData();
  }
  @Input() set activePeriod(activePeriod: number) {
    this._activePeriod = activePeriod;
    this.loadEditorData();
  }

  @Input() isOpen = false;
  constructor(
    public store: BudgetStore,
    private router: Router,
    private route: ActivatedRoute
  ) {}

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

  // use trackby on inputs as otherwise each one changing would re-render all others
  // (updating any input re-renders all others)
  trackByIndex(index: number, obj: any): any {
    return index;
  }
}

// const EDITOR_STEPS: (IBudgetPeriodType | 'summary')[] = [
//   'activities',
//   'inputs',
//   'familyLabour',
//   'outputs',
//   'produceConsumed',
//   'summary',
// ];
