import { Component } from '@angular/core';

// HACK - to refactor
import { ACTIVITY_DATA } from '../../data';

@Component({
  selector: 'farmer-activity-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  public gridData = ACTIVITY_DATA;
}
