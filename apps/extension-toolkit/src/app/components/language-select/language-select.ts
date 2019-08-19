import { Component, OnInit } from '@angular/core';
import { ENVIRONMENT } from '@picsa/environments';
import { UserStore } from '../../store/user.store';
import { PicsaDialogService } from '@picsa/features';
import { IRegionLang } from '@picsa/models';

@Component({
  selector: 'language-select',
  templateUrl: 'language-select.html',
  styleUrls: ['./language-select.scss']
})
export class LanguageSelectComponent implements OnInit {
  languages: IRegionLang[] = ENVIRONMENT.region.languages;
  language: IRegionLang;

  constructor(
    private userStore: UserStore,
    private dialog: PicsaDialogService
  ) {
    this.language = this.languages[0];
  }
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

  // send language update to redux or update local ngmodel depending on source of update
  setLanguage(language: IRegionLang) {
    this.userStore.updateUser({
      lang: language.code
    });
    this.language = language;
  }
}
