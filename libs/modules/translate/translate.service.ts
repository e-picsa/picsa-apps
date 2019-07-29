import { OnDestroy, Injectable } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
import { LoadingOptions, ToastOptions } from '@ionic/core';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import * as translations from './translations';

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
    console.log('picsa translate service init');
    this.init();
  }
  // subscrib to language changes and retranslate static translations
  init(defaultLang = 'en') {
    // add translations
    // TODO - pass config param from module to customise what is loaded
    this.translate.setTranslation('en', translations.en);
    this.translate.setTranslation('ny', translations.ny);
    this.translate.setTranslation('sw', translations.sw);
    // add subscribers
    this.translate.onLangChange.subscribe((l: LangChangeEvent) => {
      this.language = l.lang;
      this.prepareStaticTranslations();
    });
    this.translate.use(defaultLang);
  }
  ngOnDestroy() {
    this.translate.onLangChange.unsubscribe();
  }

  // simple wrapper for ionic toast to allow text translation
  async createTranslatedToast(config: ToastOptions, timeout?: number) {
    config.message = await this.translateText(config.message);
    if (timeout) {
      await _wait(timeout);
    }
    return await this.toastCtrl.create(config);
  }

  async createTranslatedLoader(config: LoadingOptions) {
    config.message = await this.translateText(config.message);
    if (this.loader) {
      await this.loader.dismiss();
    }
    return this.loadingCtrl.create(config);
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
    console.log('month names', this.monthNames);
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
