import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { LanguageSelectDialog } from './language-select-dialog';
import { ConfigurationService } from '@picsa/configuration/src';

@Component({
  selector: 'language-select',
  templateUrl: 'language-select.html',
  styleUrls: ['./language-select.scss'],
})
export class LanguageSelectComponent {
  constructor(
    private dialog: MatDialog,
    public configurationService: ConfigurationService
  ) {}
  get image() {
    return this.configurationService.activeConfiguration.meta.image;
  }
  get label() {
    const { country, language } =
      this.configurationService.activeConfiguration.localisation;
    return `${country.label} - ${language.selected?.label}`;
  }

  async openLanguageSelect() {
    this.dialog.open(LanguageSelectDialog, {});
  }
}
