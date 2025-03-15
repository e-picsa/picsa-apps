import { Component } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'picsa-seasonal-calendar-tool',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent {
  title = 'seasonal-calendar';
}

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'picsa-seasonal-calendar-tool',
  template: '',
  standalone: false,
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class AppComponentEmbedded extends AppComponent {}
