import { effect, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ConfigurationService } from '@picsa/configuration/src';

@Injectable()
export class PicsaTranslateService {
  public language = 'en';
  constructor(public ngxTranslate: TranslateService, configurationService: ConfigurationService) {
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
    const translation = await this.ngxTranslate.get(text).toPromise();
    return translation;
  }

  async translateArray(arr: string[]) {
    const translatePromises = arr.map(async (text) => await this.translateText(text));
    const translatedArr = await Promise.all(translatePromises);
    return translatedArr;
  }
}
