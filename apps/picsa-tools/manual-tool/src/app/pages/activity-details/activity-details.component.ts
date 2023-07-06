import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { IManualActivity, PICSA_MANUAL_GRID_DATA } from '../../data/manual-contents';

@Component({
  selector: 'picsa-manual-activity-details',
  templateUrl: './activity-details.component.html',
  styleUrls: ['./activity-details.component.scss'],
})

export class ActivityDetailsComponent implements OnInit {
  activity?: IManualActivity;

  constructor(private route: ActivatedRoute) {}
  ngOnInit() {
    const activityId = this.route.snapshot.params.id;
    if (activityId) {
      this.activity = PICSA_MANUAL_GRID_DATA.find((activity) => activity.id === activityId);
    }
  }
}
