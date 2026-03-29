import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PicsaCommonComponentsModule } from '@picsa/components/src';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'picsa-option-tool',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [PicsaCommonComponentsModule, RouterOutlet],
})
export class AppComponent {
  title = 'picsa-option';
}

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'picsa-option-tool',
  template: '',
  standalone: true,
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class AppComponentEmbedded extends AppComponent {}
