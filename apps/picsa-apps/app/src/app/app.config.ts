import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ApplicationConfig, ErrorHandler, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { PreloadAllModules, provideRouter, withComponentInputBinding, withPreloading } from '@angular/router';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ENVIRONMENT } from '@picsa/environments/src';
import { PicsaTranslateModule } from '@picsa/i18n';
import { MockHttpInterceptor } from '@picsa/shared/mocks/mock-http.interceptor';
import { PicsaDb_V2_Module, PicsaDbModule, PicsaDeepLinksModule, PicsaNativeModule } from '@picsa/shared/modules';
import { ErrorHandlerService } from '@picsa/shared/services/core/error-handler.service';
import { MobxAngularModule } from 'mobx-angular';

import { appRoutes } from './app.routes';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection(),
    provideAnimations(),
    provideRouter(appRoutes, withPreloading(PreloadAllModules), withComponentInputBinding()),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: ErrorHandler, useClass: ErrorHandlerService },
    ...(ENVIRONMENT.useMockServices
      ? [{ provide: HTTP_INTERCEPTORS, useClass: MockHttpInterceptor, multi: true }]
      : []),
    importProvidersFrom(
      MobxAngularModule,
      PicsaDbModule.forRoot(),
      PicsaDb_V2_Module.forRoot(),
      PicsaNativeModule.forRoot(),
      PicsaTranslateModule.forRoot(),
      PicsaDeepLinksModule.forRoot({
        baseUrl: 'https://picsa.app',
      }),
    ),
  ],
};
