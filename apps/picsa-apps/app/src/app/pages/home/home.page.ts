import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PicsaCommonComponentsModule } from '@picsa/components';
import { ConfigurationService, PicsaConfigurationSelectComponent } from '@picsa/configuration';
import { PicsaTranslateModule } from '@picsa/i18n';

@Component({
  selector: 'picsa-app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PicsaConfigurationSelectComponent, FormsModule, PicsaTranslateModule, PicsaCommonComponentsModule],
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
