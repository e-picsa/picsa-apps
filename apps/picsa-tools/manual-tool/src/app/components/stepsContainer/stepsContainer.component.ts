import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n';

import { IManualPeriodEntryLocalised, IManualStepLocalised } from '../../models';
import { ManualToolMaterialModule } from '../material.module';

@Component({
  selector: 'picsa-manual-steps-container',
  templateUrl: './stepsContainer.component.html',
  styleUrls: ['./stepsContainer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIcon, PicsaTranslateModule, ManualToolMaterialModule],
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
