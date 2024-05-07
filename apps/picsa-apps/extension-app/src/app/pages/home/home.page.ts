import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { ConfigurationService, PicsaConfigurationSelectComponent } from '@picsa/configuration';

import { PicsaExtensionHomeComponent } from './components/extension/extension-home.component';

@Component({
  selector: 'picsa-app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, PicsaConfigurationSelectComponent, PicsaExtensionHomeComponent],
})
export class HomePageComponent {
  showFirstLoadScreen = computed(() => {
    const { deployment_id } = this.configurationService.userSettings();
    return deployment_id ? false : true;
  });

  constructor(public configurationService: ConfigurationService) {}
}
