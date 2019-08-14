import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PicsaDbService } from '@picsa/services/core';
import { DBCacheService } from '@picsa/services/core/db/_cache.db';
import { DBServerService } from '@picsa/services/core/db/_server.db';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireAuthModule } from '@angular/fire/auth';
import ENVIRONMENT from '@picsa/environments/environment';
import { DBSyncService } from '@picsa/services/core/db/sync.service';

// initiate db and auth in shared lib to be available throughout app
@NgModule({
  imports: [
    CommonModule,
    AngularFireModule.initializeApp(ENVIRONMENT.firebase),
    AngularFirestoreModule.enablePersistence(),
    AngularFireAuthModule
  ]
})
export class PicsaDbModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: PicsaDbModule,
      providers: [
        DBCacheService,
        DBServerService,
        DBSyncService,
        PicsaDbService
      ]
    };
  }
}
