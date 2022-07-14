import { Component } from '@angular/core';

@Component({
  selector: 'picsa-resources-tool',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'picsa-resources';
}

@Component({
  // tslint:disable component-selector
  selector: 'picsa-resources-tool',
  template: '',
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class AppComponentEmbedded extends AppComponent {}
