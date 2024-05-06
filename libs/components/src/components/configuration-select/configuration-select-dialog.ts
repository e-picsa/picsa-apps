import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect } from '@angular/core';
import { ConfigurationService } from '@picsa/configuration/src';
import {
  DEPLOYMENT_DATA,
  IDeploymentId,
  IDeploymentSettingsDataEntry,
  ILanguageCode,
  ILanguageDataEntry,
  LANGUAGES_DATA_HASHMAP,
} from '@picsa/data/deployments';

@Component({
  selector: 'picsa-language-select-dialog',
  templateUrl: './configuration-select-dialog.html',
  styleUrls: ['./configuration-select-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class ConfigurationSelectDialog {
  public deploymentOptions = DEPLOYMENT_DATA;
  public deploymentSelected: IDeploymentId;

  public languageSelected: ILanguageCode;
  public languageOptions: ILanguageDataEntry[] = [];

  constructor(public configurationService: ConfigurationService, cdr: ChangeDetectorRef) {
    effect(() => {
      const { deployment_id, language_code } = this.configurationService.userSettings();
      this.deploymentSelected = deployment_id;
      this.languageSelected = language_code;
      const { language_codes } = this.configurationService.deploymentSettings();
      this.languageOptions = language_codes.map((code) => LANGUAGES_DATA_HASHMAP[code]);
      cdr.markForCheck();
    });
  }

  setLocalisation(option: IDeploymentSettingsDataEntry) {
    this.deploymentSelected = option.id;
    this.configurationService.updateUserSettings({ deployment_id: (option as any).id });
  }

  public setLanguage(option: ILanguageDataEntry) {
    this.configurationService.updateUserSettings({ language_code: option.id });
  }
}
