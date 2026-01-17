import { ChangeDetectionStrategy, Component, effect, inject,signal } from '@angular/core';
import { Router } from '@angular/router';
import { ConfigurationService, PicsaConfigurationSelectComponent } from '@picsa/configuration';

@Component({
  selector: 'picsa-app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PicsaConfigurationSelectComponent],
})
export class HomePageComponent {
  configurationService = inject(ConfigurationService);

  // use a signal to only show content after potential redirects evaluated
  showContent = signal(false);

  constructor() {
    const router = inject(Router);

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
