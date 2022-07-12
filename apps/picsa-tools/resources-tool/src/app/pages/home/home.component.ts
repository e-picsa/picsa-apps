import { Component } from '@angular/core';
import { ResourcesStore } from '../../stores';

@Component({
  selector: 'picsa-resources-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  constructor(public store: ResourcesStore) {}
}
