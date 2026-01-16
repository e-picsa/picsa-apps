import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ILocaleCode } from '@picsa/data/deployments';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PicsaTranslateService {
  public language: ILocaleCode = 'global_en';
  constructor(public ngxTranslate: TranslateService) {
    ngxTranslate.setDefaultLang('global_en');
  }
  public setLanguage(code: ILocaleCode) {
    if (code === this.language) return;
    this.language = code;
    // use global en if any localised en language selected
    if (code.endsWith('_en')) {
      this.ngxTranslate.use('global_en');
    } else {
      this.ngxTranslate.use(code);
    }
  }

  // use translate service to translate strings that will be displayed
  // outside of html templates (where pipe method used instead)
  async translateText(text = '') {
    if (!text) return text;
    return firstValueFrom(this.ngxTranslate.get(text));
  }

  async translateArray(arr: string[]) {
    const translatePromises = arr.map(async (text) => await this.translateText(text));
    const translatedArr = await Promise.all(translatePromises);
    return translatedArr;
  }
}
