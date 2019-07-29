// similar code in core, however this is known working implementation
import { NgModule, ModuleWithProviders } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { PicsaTranslateService } from './translate.service';

// repeat main app.module loader to allow lazy-loaded modules import of translate
// see: https://github.com/ngx-translate/core/issues/425
// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}

@NgModule({
  imports: [
    HttpClientModule,
    TranslateModule
      .forRoot
      // // Alt approach if loading from json, but harder to work efficiently with lazy loading on both
      // // this module and the child translate module (double lazy)
      //   {
      //   loader: {
      //     provide: TranslateLoader,
      //     useFactory: HttpLoaderFactory,
      //     deps: [HttpClient]
      //   }
      // }
      ()
  ],
  exports: [TranslateModule]
})
// we want to pass the picsa translate service along with the module, and ensure duplicate
// versions are not registered. For more info see:
// https://angular.io/guide/singleton-services#
// For apps consuming, this needs therefore to be imported in an eager module, such as app.module.ts
export class PicsaTranslateModule {
  // // could add check to prevent re-import, but this breaks lazy loading
  // constructor(@Optional() @SkipSelf() parentModule: PicsaTranslateModule) {
  //   if (parentModule) {
  //     // prevent duplicate initialisation of the module
  //     throw new Error(
  //       'Translate Module is already loaded. Import it in the AppModule only'
  //     );
  //   }
  // }
  // provide option to register module once as root to prevent duplicate initialisation of providers
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: PicsaTranslateModule,
      providers: [PicsaTranslateService]
    };
  }
  // Todo - create different module that can allow the translateModule.forChild() method to be called
  // Alternatively - shift all instantiation of languages to provider (?)
  static forChild(): ModuleWithProviders {
    return {
      ngModule: PicsaTranslateModule
    };
  }
}
