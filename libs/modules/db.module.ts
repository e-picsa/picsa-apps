import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/core/auth.service';
import { PicsaDbService } from '../services/core';
import DBCacheService from '../services/core/db/_cache.db';
import DBServerService from '../services/core/db/_cache.db';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireAuthModule } from '@angular/fire/auth';
import ENVIRONMENT from '../environments/environment';
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
        PicsaDbService,
        AuthService
      ]
    };
  }
}
