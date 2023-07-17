import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { IManualStep, PICSA_MANUAL_LIST_DATA } from '../../data/manual-contents';

@Component({
  selector: 'picsa-manual-steps-container',
  templateUrl: './stepsContainer.component.html',
  styleUrls: ['./stepsContainer.component.scss'],
})
export class stepsContainerComponent {
  public listData = PICSA_MANUAL_LIST_DATA;

  /** Lookup key to correctly map pages within sections (localisation code) */
  @Input() pageMapping = 'en';

  constructor(private router: Router, private route: ActivatedRoute) {}

  public goToStep(step: IManualStep) {
    // Use query params to open pageMapping mapping pages
    const queryParams = { page: step.page[this.pageMapping] || step.page.en };
    this.router.navigate([], { relativeTo: this.route, queryParams });
  }
}
