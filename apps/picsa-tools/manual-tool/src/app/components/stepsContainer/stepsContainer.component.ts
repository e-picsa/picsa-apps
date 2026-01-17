import { ChangeDetectionStrategy, Component, inject,input } from '@angular/core';
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
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  stepData = input.required<IManualPeriodEntryLocalised[]>();

  public goToStep(step: IManualStepLocalised) {
    // Use query params to open pageMapping mapping pages
    const queryParams = { page: step.page };
    this.router.navigate([], { relativeTo: this.route, queryParams });
  }
}
