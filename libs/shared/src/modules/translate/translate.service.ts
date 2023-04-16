import { Injectable,OnDestroy } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ConfigurationService } from '@picsa/configuration/src';
import { Subject, takeUntil } from 'rxjs';

@Injectable()
export class PicsaTranslateService implements OnDestroy {
  loader: HTMLIonLoadingElement;
  monthNames: string[] = MONTHS;
  public language = 'en';
  private destroyed$ = new Subject<boolean>();
  constructor(
    public toastCtrl: ToastController,
    public ngxTranslate: TranslateService,
    public loadingCtrl: LoadingController,
    public configurationService: ConfigurationService
  ) {
    this.subscribeToConfigLanguageChanges();
  }

  ngOnDestroy() {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }

  private subscribeToConfigLanguageChanges() {
    this.configurationService.activeConfiguration$.pipe(takeUntil(this.destroyed$)).subscribe((config) => {
      const language = config.localisation.language.selected?.code;
      if (language && language !== this.language) {
        this.language = language;
        this.prepareStaticTranslations();
        this.ngxTranslate.use(language);
      }
    });
  }

  // use translate service to translate strings that will be displayed
  // outside of html templates (where pipe method used instead)
  async translateText(text: string) {
    const translation = await this.ngxTranslate.get(text).toPromise();
    return translation;
  }

  async translateArray(arr: string[]) {
    const translatePromises = arr.map(async (text) => this.translateText(text));
    const translatedArr = await Promise.all(translatePromises);
    return translatedArr;
  }

  // some methods such as climate tool chart rendering require hardcoded values for callback functions
  // these are calculated when language changed
  async prepareStaticTranslations() {
    this.monthNames = await this.translateArray(MONTHS);
  }
}

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
  'December',
];

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
