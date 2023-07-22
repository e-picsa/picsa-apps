import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { IManualPeriodEntry, IManualStep } from '../../data';

@Component({
  selector: 'picsa-manual-steps-container',
  templateUrl: './stepsContainer.component.html',
  styleUrls: ['./stepsContainer.component.scss'],
})
export class stepsContainerComponent {
  @Input() stepData: IManualPeriodEntry[];

  /** Lookup key to correctly map pages within sections (localisation code) */
  @Input() pageMapping = 'en';

  constructor(private router: Router, private route: ActivatedRoute) {}

  public goToStep(step: IManualStep) {
    // Use query params to open pageMapping mapping pages
    const queryParams = { page: step.page[this.pageMapping] || step.page.en };
    this.router.navigate([], { relativeTo: this.route, queryParams });
  }
}
