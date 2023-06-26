import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  IManualActivity,
  IManualStep,
  PICSA_MANUAL_GRID_DATA,
  PICSA_MANUAL_LIST_DATA,
} from '../../data/manual-contents';

@Component({
  selector: 'picsa-manual-steps-container',
  templateUrl: './stepsContainer.component.html',
  styleUrls: ['./stepsContainer.component.scss'],
})
export class stepsContainerComponent {
  public view: 'grid' | 'list' = 'list';
  public gridData = PICSA_MANUAL_GRID_DATA;
  public listData = PICSA_MANUAL_LIST_DATA;

  constructor(private router: Router, private route: ActivatedRoute) {}

  public goToStep(step: IManualStep) {
    this.router.navigate([], { relativeTo: this.route, queryParams: { page: step.page.en } });
  }
  public goToActivity(activity: IManualActivity) {
    this.router.navigate(['activity', activity.id], { relativeTo: this.route, state: { activity: activity } });
  }
}
