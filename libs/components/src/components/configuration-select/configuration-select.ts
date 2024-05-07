import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect } from '@angular/core';
import { ConfigurationService } from '@picsa/configuration/src';
import { LANGUAGES_DATA_HASHMAP } from '@picsa/data/deployments';

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
      const { assetIconPath, label } = this.configurationService.deploymentSettings();
      const { language_code } = this.configurationService.userSettings();
      const languageMeta = LANGUAGES_DATA_HASHMAP[language_code];
      this.label = label;
      if (languageMeta) {
        this.label += ` - ${languageMeta.language_label}`;
      }
      this.image = assetIconPath;
      this.cdr.markForCheck();
    });
  }

  async openLanguageSelect() {
    // this.dialog.open(ConfigurationSelectDialog, {});
    // TODO - consider if wanting previous dialog or just remove
    this.configurationService.resetUserSettings();
  }
}
