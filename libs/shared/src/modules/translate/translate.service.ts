import { Injectable, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ConfigurationService } from '@picsa/configuration/src';
import { Subject, takeUntil } from 'rxjs';

@Injectable()
export class PicsaTranslateService implements OnDestroy {
  public language = 'en';
  private destroyed$ = new Subject<boolean>();
  constructor(public ngxTranslate: TranslateService, public configurationService: ConfigurationService) {
    this.subscribeToConfigLanguageChanges();
  }

  ngOnDestroy() {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }

  private subscribeToConfigLanguageChanges() {
    this.configurationService.activeConfiguration$.pipe(takeUntil(this.destroyed$)).subscribe(async (config) => {
      const language = config.localisation.language.selected?.code;
      if (language && language !== this.language) {
        this.language = language;
        this.ngxTranslate.use(language);
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
