import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PicsaCommonComponentsModule } from '@picsa/components';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'picsa-seasonal-calendar-tool',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [PicsaCommonComponentsModule, RouterOutlet],
})
export class AppComponent {
  title = 'seasonal-calendar';
}

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'picsa-seasonal-calendar-tool',
  template: '',
  standalone: true,
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class AppComponentEmbedded extends AppComponent {}
