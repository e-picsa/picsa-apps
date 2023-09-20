import { Component } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'picsa-resources-tool',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'picsa-resources';
}

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'picsa-resources-tool',
  template: '',
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class AppComponentEmbedded extends AppComponent {}
