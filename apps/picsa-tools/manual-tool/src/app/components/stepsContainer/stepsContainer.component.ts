import { Component } from '@angular/core';

import { PICSA_MANUAL_GRID_DATA, PICSA_MANUAL_LIST_DATA } from '../../data/manual-contents';

@Component({
  selector: 'picsa-manual-steps-container',
  templateUrl: './stepsContainer.component.html',
  styleUrls: ['./stepsContainer.component.scss'],
})
export class stepsContainerComponent {
  public view: 'grid' | 'list' = 'list';
  public gridData = PICSA_MANUAL_GRID_DATA;
  public listData = PICSA_MANUAL_LIST_DATA;
}
