import { inject, ModuleWithProviders, NgModule, provideAppInitializer } from '@angular/core';

import { PicsaDatabase_V2_Service } from '../../services/core/db_v2/db.service';

/**
 * Use an init factory to allow async initialisation of the service
 * https://stackoverflow.com/questions/46257184/angular-async-factory-provider
 */
function dbInitFactory(dbService: PicsaDatabase_V2_Service) {
  return () => dbService.ready();
}

/**
 * Provide lazy-loadable module to include PICSA DB services to tools
 * Once imported the `PicsaDatabase_V2_Service` can be freely used
 * inside any component
 * 
 * The module should be imported `forRoot` in the main app module, e.g.
    ```
    NgModule({
      imports: [PicsaDb_V2_Module.forRoot()],
    })
    export class AppModule
    ```
 * The module should be imported regularly for any lazy-loaded child modules 
 */
@NgModule({
  imports: [],
})
export class PicsaDb_V2_Module {
  static forRoot(): ModuleWithProviders<PicsaDb_V2_Module> {
    return {
      ngModule: PicsaDb_V2_Module,
      providers: [
        provideAppInitializer(() => {
          const initializerFn = dbInitFactory(inject(PicsaDatabase_V2_Service));
          return initializerFn();
        }),
      ],
    };
  }
}
