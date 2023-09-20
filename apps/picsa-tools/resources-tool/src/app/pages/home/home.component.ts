import { Component } from '@angular/core';

import { ResourcesStore } from '../../stores';

@Component({
  selector: 'resource-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  constructor(public store: ResourcesStore) {}
}
