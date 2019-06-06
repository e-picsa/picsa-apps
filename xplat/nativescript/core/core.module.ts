import { NgModule, Optional, SkipSelf } from '@angular/core';

// nativescript
import { NativeScriptModule } from 'nativescript-angular/nativescript.module';
import { NativeScriptHttpClientModule } from 'nativescript-angular/http-client';
import { device } from 'tns-core-modules/platform';
import { TNSFontIconModule } from 'nativescript-ngx-fonticon';

// libs
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import {
  CoreModule,
  PlatformLanguageToken,
  PlatformWindowToken
} from '@picsa/core';
import { throwIfAlreadyLoaded } from '@picsa/utils';

// app
import { PROVIDERS } from './services';
import { TNSWindowService } from './services/tns-window.service';
import { TNSTranslateLoader } from './services/tns-translate.loader';

// factories
export function platformLangFactory() {
  return device.language;
}

export function createTranslateLoader() {
  return new TNSTranslateLoader('/assets/i18n/');
}

@NgModule({
  imports: [
    NativeScriptModule,
    NativeScriptHttpClientModule,
    TNSFontIconModule.forRoot({
      fa: './assets/fontawesome.min.css'
    }),
    CoreModule.forRoot([
      {
        provide: PlatformLanguageToken,
        useFactory: platformLangFactory
      },
      {
        provide: PlatformWindowToken,
        useClass: TNSWindowService
      }
    ]),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader
      }
    })
  ],
  providers: [...PROVIDERS]
})
export class FooCoreModule {
  constructor(
    @Optional()
    @SkipSelf()
    parentModule: FooCoreModule
  ) {
    throwIfAlreadyLoaded(parentModule, 'FooCoreModule');
  }
}
