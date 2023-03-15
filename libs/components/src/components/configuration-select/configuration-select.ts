import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfigurationSelectDialog } from './configuration-select-dialog';
import { ConfigurationService } from '@picsa/configuration/src';

@Component({
  selector: 'picsa-configuration-select',
  templateUrl: 'configuration-select.html',
  styleUrls: ['./configuration-select.scss'],
})
export class ConfigurationSelectComponent {
  constructor(
    private dialog: MatDialog,
    public configurationService: ConfigurationService
  ) {}
  get image() {
    return this.configurationService.activeConfiguration.localisation.country
      .image;
  }
  get label() {
    const { country, language } =
      this.configurationService.activeConfiguration.localisation;
    return `${country.label} - ${language.selected?.label}`;
  }

  async openLanguageSelect() {
    this.dialog.open(ConfigurationSelectDialog, {});
  }
}
