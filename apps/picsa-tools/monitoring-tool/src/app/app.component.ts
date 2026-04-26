import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'picsa-monitoring-tool',
  template: `<router-outlet></router-outlet>`,
  imports: [RouterOutlet],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class PicsaMonitoringTool {
  title = 'monitoring-tool';
}
