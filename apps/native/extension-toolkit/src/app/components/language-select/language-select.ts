import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ENVIRONMENT } from '@picsa/environments';
import { PicsaDialogService } from '@picsa/features';
import { IRegionLang } from '@picsa/models';

@Component({
  selector: 'language-select',
  templateUrl: 'language-select.html',
  styleUrls: ['./language-select.scss']
})
export class LanguageSelectComponent implements OnInit {
  languages: IRegionLang[] = ENVIRONMENT.region.languages;
  @Input() language: IRegionLang;
  @Output() onlanguageSelected = new EventEmitter<IRegionLang>();

  constructor(private dialog: PicsaDialogService) {}
  ngOnInit() {}

  async openLanguageSelect() {
    const selectOptions = this.languages.map(l => {
      return {
        image: `assets/images/flags/${l.country}.svg`,
        text: l.label,
        data: l
      };
    });
    const dialog = await this.dialog.open('languageSelect', {
      selectOptions,
      title: 'Select Language'
    });
    await dialog.afterClosed().subscribe(data => {
      if (data) {
        this.setLanguage(data);
      }
    });
  }

  setLanguage(language: IRegionLang) {
    this.onlanguageSelected.emit(language);
  }
}
