import { Component, ViewChild, OnDestroy, OnInit, Input } from '@angular/core';
import { BudgetStore } from '../../store/budget.store';
import {
  IBudgetCardWithValues,
  IBudgetPeriodType,
  IBudgetPeriodData
} from '../../models/budget-tool.models';
import { FadeInOut, ANIMATION_DELAYED } from '@picsa/animations';
import { MatStepper } from '@angular/material';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'budget-cell-editor',
  templateUrl: './cell-editor.html',
  styleUrls: ['./cell-editor.scss'],
  animations: [FadeInOut(ANIMATION_DELAYED)]
})

/*  The budget cell editor sits on top of the budget table, so that when opened covers the table
 */
export class BudgetCellEditorComponent {
  steps = EDITOR_STEPS;
  @Input() data: IBudgetPeriodData;
  @Input() set activeType(type: IBudgetPeriodType) {
    this.setActiveStep(type);
  }
  @ViewChild('stepper', { static: true }) stepper: MatStepper;
  @ViewChild('subStepper', { static: true }) subStepper: MatStepper;
  constructor(
    public store: BudgetStore,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngAfterViewInit(): void {
    // ignore icons and just display number
    this.stepper._getIndicatorType = () => 'number';
  }

  setActiveStep(type: IBudgetPeriodType) {
    const index = EDITOR_STEPS.indexOf(type);
    this.stepper.selectedIndex = index;
  }

  // the store already knows what period and type it is, so just pass the updated values
  // back up to save
  onEditorChange(values: IBudgetCardWithValues[], type: IBudgetPeriodType) {
    this.store.saveEditor(values, type);
  }

  // as can't easily prevent default step click behaviour, instead add extra call to update
  // query params after
  stepChange(e: StepperSelectionEvent) {
    const step = EDITOR_STEPS[e.selectedIndex];
    // as can't disable stepper slide animation use timeout to delay other animations
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        type: step
      },
      replaceUrl: true,
      queryParamsHandling: 'merge'
    });
  }

  // TODO - could be moved to store along with budget-table similar code
  goToNextPeriod() {
    const period = this.store.activePeriod;
    const totalPeriods = this.store.activeBudget.meta.lengthTotal;
    this.stepper.reset();
    this.subStepper.reset();
    if (period < totalPeriods) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          period: period + 1,
          type: 'activities',
          label: this.store.budgetPeriodLabels[period + 1]
        },
        queryParamsHandling: 'merge'
      });
    } else {
      this.router.navigate([], {
        relativeTo: this.route
      });
    }
  }

  // use trackby on inputs as otherwise each one changing would re-render all others
  // (updating any input re-renders all others)
  trackByIndex(index: number, obj: any): any {
    return index;
  }
}

const EDITOR_STEPS: (IBudgetPeriodType | 'summary')[] = [
  'activities',
  'inputs',
  'familyLabour',
  'outputs',
  'produceConsumed',
  'summary'
];
