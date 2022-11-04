import { Component } from '@angular/core';

@Component({
  selector: 'picsa-monitoring-tool',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'picsa-monitoring';
}

@Component({
  // tslint:disable component-selector
  selector: 'picsa-monitoring-tool',
  template: '',
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class AppComponentEmbedded extends AppComponent {}
