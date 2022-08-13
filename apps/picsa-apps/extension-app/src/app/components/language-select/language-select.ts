import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ENVIRONMENT } from '@picsa/environments';
import { IRegionLang } from '@picsa/models';
import { ConfigurationService, IConfiguration } from '@picsa/configuration';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'language-select',
  templateUrl: 'language-select.html',
  styleUrls: ['./language-select.scss'],
})
export class LanguageSelectComponent {
  languages: IRegionLang[] = ENVIRONMENT.region.languages;
  @Input() language: IRegionLang;
  @Output() onlanguageSelected = new EventEmitter<IRegionLang>();

  constructor(private dialog: MatDialog) {}

  async openLanguageSelect() {
    const selectOptions = this.languages.map((l) => {
      return {
        image: `assets/images/flags/${l.country}.svg`,
        text: l.label,
        data: l,
      };
    });
    const dialog = this.dialog.open(LanguageSelectDialog, {});
    await dialog.afterClosed().subscribe((data) => {
      if (data) {
        this.setLanguage(data);
      }
    });
  }

  setLanguage(language: IRegionLang) {
    this.onlanguageSelected.emit(language);
  }
}

@Component({
  selector: 'picsa-language-select-dialog',
  template: `
    <h2>Select Country</h2>
    <div style="display: flex">
      <div
        *ngFor="let option of selectOptions"
        class="select-option"
        (click)="setCountry(option.country.code)"
      >
        <img
          [src]="'assets/images/flags/' + option.country.code + '.svg'"
          class="select-image"
        />
        <div>{{ option.country.label }}</div>
      </div>
    </div>
    <div *ngIf="configurationService.userSettings.localisation">
      <h2>Select Language</h2>
    </div>

    <!-- <div style="display: flex">
      <div
        *ngFor="let language of languages"
        class="select-option"
        (click)="select(language)"
      >
        <img
          [src]="'assets/images/flags/' + language.country + '.svg'"
          class="select-image"
        />
        <div>{{ language.label }}</div>
      </div>
    </div> -->
  `,
})
export class LanguageSelectDialog {
  public countryOptions: IConfiguration['localisation']['options'];
  public languageOptions = []
  constructor(public configurationService: ConfigurationService) {
    const { activeConfiguration } = this.configurationService;
    this.countryOptions = activeConfiguration.localisation.options;
    this.languageOptions = this.countryOptions[]
  }

  setCountry(code: string) {
    this.configurationService.updateUserSettings({ localisation: [code, ''] });
  }

  public select(language) {
    //
  }
}
