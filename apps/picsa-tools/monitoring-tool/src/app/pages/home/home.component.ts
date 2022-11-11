import { Component } from '@angular/core';
import { MonitoringToolService } from '../../services/monitoring-tool.service';

@Component({
  selector: 'monitoring-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
/**
 *
 * https://github.dev/enketo/enketo-core
 */
export class HomeComponent {
  constructor(public monitoringService: MonitoringToolService) {}
}
