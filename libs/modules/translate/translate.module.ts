// similar code in core, however this is known working implementation
import {
  NgModule,
  ModuleWithProviders,
  Optional,
  SkipSelf
} from '@angular/core';
import {
  TranslateModule,
  TranslateLoader,
  TranslateService as BaseTranslateService,
  TranslateStore
} from '@ngx-translate/core';
import {
  HttpClient,
  HttpHandler,
  HttpClientModule
} from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { PicsaTranslateService } from './translate.service';

// repeat main app.module loader to allow lazy-loaded modules import of translate
// see: https://github.com/ngx-translate/core/issues/425
export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}

@NgModule({
  imports: [TranslateModule.forRoot()],
  exports: [TranslateModule],
  // need to pass all providers that could be required by base translate module
  // note, could probably streamline by better use of forRoot/forChild methods
  providers: [PicsaTranslateService, BaseTranslateService, TranslateStore]
})
// we want to pass the picsa translate service along with the module, and ensure duplicate
// versions are not registered. For more info see:
// https://angular.io/guide/singleton-services#
export class PICSATranslateModule {
  constructor(@Optional() @SkipSelf() parentModule: PICSATranslateModule) {
    if (parentModule) {
      // prevent duplicate initialisation of the module
      throw new Error(
        'Translate Module is already loaded. Import it in the AppModule only'
      );
    }
  }
  // provide option to register module once as root to prevent duplicate initialisation of providers
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: PICSATranslateModule,
      providers: [PicsaTranslateService, BaseTranslateService]
    };
  }
}

// TranslateModule.forChild({
//   loader: {
//     provide: TranslateLoader,
//     useFactory: createTranslateLoader,
//     deps: [HttpClient]
//   }
// })

interface ITranslateConfig {}
