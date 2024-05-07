import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect } from '@angular/core';
import { ConfigurationService } from '@picsa/configuration/src';
import { COUNTRIES_DATA_HASHMAP, LANGUAGES_DATA_HASHMAP } from '@picsa/data/deployments';

@Component({
  selector: 'picsa-configuration-select',
  templateUrl: 'configuration-select.html',
  styleUrls: ['./configuration-select.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigurationSelectComponent {
  public label = '';
  public image = '';
  constructor(public configurationService: ConfigurationService, private cdr: ChangeDetectorRef) {
    effect(() => {
      const { country_code } = this.configurationService.deploymentSettings();
      if (country_code) {
        const countryMeta = COUNTRIES_DATA_HASHMAP[country_code];
        const { flag_path, label } = countryMeta;
        this.label = label;
        const { language_code } = this.configurationService.userSettings();
        const languageMeta = LANGUAGES_DATA_HASHMAP[language_code];
        if (languageMeta) {
          this.label += ` - ${languageMeta.language_label}`;
        }
        this.image = flag_path;
        this.cdr.markForCheck();
      }
    });
  }

  async openLanguageSelect() {
    this.configurationService.resetUserSettings();
  }
}
