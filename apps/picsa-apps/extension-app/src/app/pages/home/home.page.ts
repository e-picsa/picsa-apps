import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { ConfigurationService } from '@picsa/configuration';

@Component({
  selector: 'picsa-app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  showFirstLoadScreen = computed(() => {
    const { deployment_id } = this.configurationService.userSettings();
    return deployment_id ? false : true;
  });

  constructor(public configurationService: ConfigurationService) {}
}
