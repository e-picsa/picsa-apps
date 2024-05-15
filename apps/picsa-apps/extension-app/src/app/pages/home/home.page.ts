import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigurationService, PicsaConfigurationSelectComponent } from '@picsa/configuration';

import { PicsaExtensionHomeComponent } from './components/extension/extension-home.component';
import { PicsaFarmerHomeComponent } from './components/farmer/farmer-home.component';

@Component({
  selector: 'picsa-app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, PicsaConfigurationSelectComponent, PicsaExtensionHomeComponent, PicsaFarmerHomeComponent],
})
export class HomePageComponent {
  showFirstLoadScreen = computed(() => {
    const { deployment_id } = this.configurationService.userSettings();
    return deployment_id ? false : true;
  });

  constructor(
    public configurationService: ConfigurationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    effect(() => {
      const { deployment_id, user_type } = this.configurationService.userSettings();
      if (deployment_id && user_type) {
        console.log('redirecting', deployment_id, user_type);
        router.navigate([user_type], { relativeTo: this.route });
      }
    });
  }
}
