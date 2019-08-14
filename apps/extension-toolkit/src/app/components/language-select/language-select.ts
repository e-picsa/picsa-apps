import { Component, ViewChild, OnInit } from '@angular/core';
import { IonSelect } from '@ionic/angular';
import { ENVIRONMENT } from '@picsa/environments';
import { UserStore } from '../../store/user.store';

interface ILanguage {
  label: string;
  code: string;
}
@Component({
  selector: 'language-select',
  templateUrl: 'language-select.html',
  styleUrls: ['./language-select.scss']
})
export class LanguageSelectComponent implements OnInit {
  languages: ILanguage[] = ENVIRONMENT.region.languages;
  language: ILanguage;
  @ViewChild(IonSelect, { static: false }) select: IonSelect;

  constructor(private userStore: UserStore) {}
  ngOnInit() {
    // console.log('langCode', this.langCode$);
    // this.langCode$.pipe(takeUntil(this.componentDestroyed)).subscribe(code => {
    //   if (code) {
    //     this.setLanguage(code, 'redux');
    //   } else {
    //     console.log('no language specified, setting default');
    //     this.language = this.languages[0];
    //   }
    // });
  }
  ngOnDestroy() {}
  openLanguageSelect() {
    this.select.open();
  }

  // send language update to redux or update local ngmodel depending on source of update
  setLanguage(code: string, source: 'redux' | 'home') {
    if (source == 'redux') {
      if (code && this.language && this.language.code != code) {
        this.language = this.languages.filter(l => {
          return l.code === code;
        })[0];
      }
    } else {
      this.userStore.updateUser({
        lang: this.language.code
      });
    }
  }
}
