import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { APP_VERSION } from '@picsa/environments/src/version';

@Component({
  selector: 'dashboard-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, MatButtonModule],
})
export class DashboardFooterComponent {
  public appVersion = APP_VERSION;
}
