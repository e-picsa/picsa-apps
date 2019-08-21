import { OnDestroy, Injectable } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { LanguageCode } from '@picsa/models';

@Injectable()
export class PicsaTranslateService implements OnDestroy {
  loader: HTMLIonLoadingElement;
  monthNames: string[] = MONTHS;
  public language: string;
  constructor(
    public toastCtrl: ToastController,
    public translate: TranslateService,
    public loadingCtrl: LoadingController
  ) {
    this.init();
  }
  // subscrib to language changes and retranslate static translations
  init(defaultLang = 'ny') {
    // TODO - pass config param from module to customise what is loaded
    // add subscribers
    this.translate.onLangChange.subscribe(async (l: LangChangeEvent) => {
      this.language = l.lang;
      const test = await this.translateText('Activities');
      console.log(`[${this.language}] language`, test);
      this.prepareStaticTranslations();
    });
    this.translate.use(defaultLang);
  }
  setLang(code: LanguageCode) {
    this.translate.use(code);
  }
  ngOnDestroy() {
    this.translate.onLangChange.unsubscribe();
  }

  // use translate service to translate strings that will be displayed
  // outside of html templates (where pipe method used instead)
  async translateText(text: string) {
    const translation = await this.translate.get(text).toPromise();
    return translation;
  }

  async translateArray(arr: string[]) {
    const translatePromises = arr.map(async text => this.translateText(text));
    const translatedArr = await Promise.all(translatePromises);
    return translatedArr;
  }

  // some methods such as climate tool chart rendering require hardcoded values for callback functions
  // these are calculated when language changed
  async prepareStaticTranslations() {
    this.monthNames = await this.translateArray(MONTHS);
  }
}

// simple function to allow async function to wait a set amount of time before completing
const _wait = ms => new Promise((r, j) => setTimeout(r, ms));

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];
