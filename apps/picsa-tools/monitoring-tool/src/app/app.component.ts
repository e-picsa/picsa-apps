import { Component } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'picsa-monitoring-tool',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent {
  title = 'picsa-monitoring';
}

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'picsa-monitoring-tool',
  template: '',
  standalone: false,
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class AppComponentEmbedded extends AppComponent {}
