import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { IManualActivity } from '../../data/manual-contents';

@Component({
  selector: 'picsa-manual-activity-details',
  templateUrl: './activity-details.component.html',
  styleUrls: ['./activity-details.component.scss'],
})
export class ActivityDetailsComponent implements OnInit {
  activity: IManualActivity;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.activity = history.state.activity;
  }
}
