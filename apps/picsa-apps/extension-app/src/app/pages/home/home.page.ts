import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ConfigurationService, PicsaConfigurationSelectComponent } from '@picsa/configuration';

@Component({
  selector: 'picsa-app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PicsaConfigurationSelectComponent],
})
export class HomePageComponent {
  // use a signal to only show content after potential redirects evaluated
  showContent = signal(false);

  constructor(public configurationService: ConfigurationService, router: Router) {
    effect(() => {
      // navigate to /extension or /farmer tool home if configured
      const { deployment_id, user_type } = this.configurationService.userSettings();
      if (deployment_id && user_type) {
        router.navigate(['/', user_type], { replaceUrl: true });
      } else {
        this.showContent.set(true);
      }
    });
  }
}
