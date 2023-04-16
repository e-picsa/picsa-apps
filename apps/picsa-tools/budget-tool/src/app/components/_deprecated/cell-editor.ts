import { BreakpointObserver } from '@angular/cdk/layout';
import {
  StepperOrientation,
  StepperSelectionEvent,
} from '@angular/cdk/stepper';
import { Component, Input,ViewChild } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { ActivatedRoute,Router } from '@angular/router';
import { ANIMATION_DELAYED,FadeInOut } from '@picsa/shared/animations';
import { map, Observable } from 'rxjs';

import {
  IBudgetCardWithValues,
  IBudgetPeriodData,
  IBudgetPeriodType,
} from '../../models/budget-tool.models';
import { BudgetStore } from '../../store/budget.store';

@Component({
  selector: 'budget-cell-editor',
  templateUrl: './cell-editor.html',
  styleUrls: ['./cell-editor.scss'],
  animations: [FadeInOut(ANIMATION_DELAYED)],
})

/*  The budget cell editor sits on top of the budget table, so that when opened covers the table
 */
export class BudgetCellEditorComponent {
  steps = EDITOR_STEPS;
  stepperOrientation: Observable<StepperOrientation>;
  data: IBudgetPeriodData;
  @Input() set activeType(type: IBudgetPeriodType) {
    this.setActiveStep(type);
  }
  @Input() set activePeriod(index: number) {
    // create copy of data to avoid first input populating multiple activities
    this.data = JSON.parse(JSON.stringify(this.store.activeBudget.data[index]));
  }

  @Input() isOpen = false;
  @ViewChild('stepper', { static: true }) stepper: MatStepper;
  @ViewChild('subStepper', { static: true }) subStepper: MatStepper;
  constructor(
    public store: BudgetStore,
    private router: Router,
    private route: ActivatedRoute,
    breakpointObserver: BreakpointObserver
  ) {
    // Make stepper orientation responsive depending on device size
    this.stepperOrientation = breakpointObserver
      .observe('(min-width: 768px)')
      .pipe(map(({ matches }) => (matches ? 'horizontal' : 'vertical')));
  }

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
        type: step,
      },
      replaceUrl: true,
      queryParamsHandling: 'merge',
    });
  }
  /**
   * Scroll to top on after step content changed (particularly if using vertical stepper)
   *
   * TODO - a little jerky, might work better with fade and animation host listener
   * https://github.com/angular/components/issues/8881
   */
  public scrollToStepTop() {
    if (this.isOpen && this.stepper.orientation === 'vertical') {
      const stepId = this.stepper._getStepLabelId(this.stepper.selectedIndex);
      const stepElement = document.getElementById(stepId);
      if (stepElement) {
        stepElement.scrollIntoView({
          block: 'start',
          inline: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }

  closeEditor() {
    this.router.navigate([], {
      relativeTo: this.route,
    });
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
  'summary',
];
