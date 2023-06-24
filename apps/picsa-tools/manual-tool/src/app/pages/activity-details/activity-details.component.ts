import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'picsa-manual-activity-details',
  templateUrl: './activity-details.component.html',
  styleUrls: ['./activity-details.component.scss'],
})
export class ActivityDetailsComponent  implements OnInit {
    activity: any;
  
    constructor(private route: ActivatedRoute) {}
  
    ngOnInit() {
      this.activity = history.state.activity;
    }

}
