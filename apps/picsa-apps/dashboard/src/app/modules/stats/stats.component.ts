import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'dashboard-app-stats',
  standalone: true,
  templateUrl: 'stats.component.html',
  styleUrl: 'stats.component.scss',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardStatsComponent {
  private sanitizer = inject(DomSanitizer);

  loading = true;
  reportUrl: SafeResourceUrl;

  constructor() {
    this.reportUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://lookerstudio.google.com/embed/reporting/424bacea-f16d-44d9-82d7-b511f44ccb94/page/yNeFF',
    );
  }

  onLoad() {
    this.loading = false;
  }
}
