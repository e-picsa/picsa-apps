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
    const { language_code, user_type } = this.configurationService.userSettings();
    return language_code && user_type ? false : true;
  });

  constructor(public configurationService: ConfigurationService) {}
}
