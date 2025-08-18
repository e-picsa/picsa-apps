import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'dashboard-app-stats',
  templateUrl: 'stats.component.html',
  styleUrl: 'stats.component.scss',
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardStatsComponent {
  loading = true;
  reportUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    this.reportUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://lookerstudio.google.com/embed/reporting/424bacea-f16d-44d9-82d7-b511f44ccb94/page/yNeFF',
    );
  }

  onLoad() {
    this.loading = false;
  }
}
