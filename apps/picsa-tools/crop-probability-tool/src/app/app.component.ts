import { Component } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'picsa-crop-probability-tool',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent {
  title = 'picsa-crop-probability';
}

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'picsa-crop-probability-tool',
  template: '',
  standalone: false,
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class AppComponentEmbedded extends AppComponent {}
