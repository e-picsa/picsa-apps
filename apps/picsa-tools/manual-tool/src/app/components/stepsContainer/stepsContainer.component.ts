import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { IManualPeriodEntryLocalised, IManualStepLocalised } from '../../models';

@Component({
  selector: 'picsa-manual-steps-container',
  templateUrl: './stepsContainer.component.html',
  styleUrls: ['./stepsContainer.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class stepsContainerComponent {
  stepData = input.required<IManualPeriodEntryLocalised[]>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  public goToStep(step: IManualStepLocalised) {
    // Use query params to open pageMapping mapping pages
    const queryParams = { page: step.page };
    this.router.navigate([], { relativeTo: this.route, queryParams });
  }
}
