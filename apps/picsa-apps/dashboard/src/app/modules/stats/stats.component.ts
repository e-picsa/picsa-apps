import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'dashboard-app-stats',
  templateUrl: 'stats.component.html',
  styleUrl: 'stats.component.scss',
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardStatsComponent {}
