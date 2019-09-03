import { Component, ViewChild, OnDestroy, OnInit, Input } from '@angular/core';
import { BudgetStore } from '../../store/budget.store';
import {
  IBudgetCard,
  IBudgetCardWithValues,
  IBudgetCardValues,
  IBudgetPeriodType,
  IBudgetActiveCell,
  IBudgetPeriodData
} from '../../models/budget-tool.models';
import { FadeInOut, ANIMATION_DELAYED } from '@picsa/animations';
import { MatStepper } from '@angular/material';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { Router, ActivatedRoute } from '@angular/router';
import { toJS } from 'mobx';

@Component({
  selector: 'budget-cell-editor',
  templateUrl: './cell-editor-2.html',
  styleUrls: ['./cell-editor.scss'],
  animations: [FadeInOut(ANIMATION_DELAYED)]
})

/*  The budget cell editor sits on top of the budget table, so that when opened covers the table
 */
export class BudgetCellEditorComponent {
  steps = EDITOR_STEPS;
  @Input() cell: IBudgetActiveCell;
  @Input() data: IBudgetPeriodData;
  @ViewChild('stepper', { static: true }) stepper: MatStepper;

  constructor(
    private store: BudgetStore,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  // as can't easily prevent default step click behaviour, instead add extra call to update
  // query params after
  stepChange(e: StepperSelectionEvent) {
    const step = EDITOR_STEPS[e.selectedIndex];
    // as can't disable stepper slide animation use timeout to delay other animations
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        type: step.type
      },
      queryParamsHandling: 'merge'
    });
  }
  // the store already knows what period and type it is, so just pass the updated values
  // back up to save
  onCardSelectValueChange(values: IBudgetCardWithValues[]) {
    this.store.saveEditor(values);
  }

  onNextClicked() {
    if (this.stepper.selectedIndex < this.stepper.steps.length - 1) {
      this.stepper.next();
    } else {
      this.saveCell();
      console.log('TODO - ROUTING');
    }
  }

  // using manual bindings instead of ngmodel as nested ngfor-ngmodel with matInput tricky
  onCardValueChange(values: IBudgetCardValues, index: number) {
    // this.selectedArray[index].values = values;
  }
  onFamilyLabourChange(values: IBudgetCardWithValues[]) {
    // this.selectedArray = values;
  }

  saveCell() {
    // this.store.saveEditor(this.selectedArray);
  }

  // use trackby on inputs as otherwise each one changing would re-render all others
  // (updating any input re-renders all others)
  trackByIndex(index: number, obj: any): any {
    return index;
  }
}
interface IEditorStep {
  type: IBudgetPeriodType;
  label: string;
}
const EDITOR_STEPS: IEditorStep[] = [
  {
    type: 'activities',
    label: 'Activities'
  },
  {
    type: 'inputs',
    label: 'Inputs'
  },

  {
    type: 'familyLabour',
    label: 'Family'
  },
  {
    type: 'outputs',
    label: 'Outputs'
  },
  {
    type: 'produceConsumed',
    label: 'Consumed'
  }
];
