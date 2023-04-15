import { Component } from '@angular/core';
import { ConfigurationService, IConfiguration } from '@picsa/configuration/src';

@Component({
  selector: 'picsa-language-select-dialog',
  templateUrl: './configuration-select-dialog.html',
  styleUrls: ['./configuration-select-dialog.scss'],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class ConfigurationSelectDialog {
  public options: IConfiguration.Localisation[];
  public selected: IConfiguration.Localisation;

  constructor(public configurationService: ConfigurationService) {
    this.loadConfigurationOptions();
  }

  private loadConfigurationOptions() {
    this.options = this.configurationService.configurationOptions.map((o) => ({
      id: o.id,
      ...o.localisation,
    }));
    this.selected = this.configurationService.activeConfiguration.localisation;
  }

  setLocalisation(option: IConfiguration.Localisation) {
    this.selected = option;
    this.configurationService.setUserConfiguration((option as any).id);
    this.loadConfigurationOptions();
  }

  public setLanguage(option: IConfiguration.Localisation['language']['selected']) {
    this.selected.language.selected = option;
    this.configurationService.updateUserConfiguration('localisation', this.selected);
    // TODO - also update translations
    // this.store.updateUser({ lang: code });
    // this.store.setLanguage(code);
  }
}
