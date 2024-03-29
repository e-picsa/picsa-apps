import { ModuleWithProviders, NgModule } from '@angular/core';

import { PicsaDbService } from '../services/core/db';
import { DBCacheService } from '../services/core/db/_cache.db';
import { DBServerService } from '../services/core/db/_server.db';
import { DBSyncService } from '../services/core/db/sync.service';

// initiate db and auth in shared lib to be available throughout app
@NgModule({
  imports: [],
})
export class PicsaDbModule {
  static forRoot(): ModuleWithProviders<PicsaDbModule> {
    return {
      ngModule: PicsaDbModule,
      providers: [DBCacheService, DBServerService, DBSyncService, PicsaDbService],
    };
  }
}
