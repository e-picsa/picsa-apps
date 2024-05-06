import { effect, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ConfigurationService } from '@picsa/configuration/src';
import { ILanguageCode } from '@picsa/data/deployments';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PicsaTranslateService {
  public language: ILanguageCode = 'gb_en';
  constructor(public ngxTranslate: TranslateService, configurationService: ConfigurationService) {
    ngxTranslate.setDefaultLang('gb_en');
    effect(() => {
      const { language_code } = configurationService.userSettings();
      if (language_code && language_code !== this.language) {
        this.language = language_code;
        this.ngxTranslate.use(language_code);
      }
    });
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
