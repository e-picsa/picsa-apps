import { Component } from '@angular/core';

import { PICSA_MANUAL_GRID_DATA_EXTENSION } from '../../data';

@Component({
  selector: 'picsa-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.scss'],
})
export class ActivityComponent {
  public gridData = PICSA_MANUAL_GRID_DATA_EXTENSION;
}
