import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularFireModule, FIREBASE_OPTIONS } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { ENVIRONMENT } from '@picsa/environments';
import { PicsaDbService } from '../services/core/db';
import { DBCacheService } from '../services/core/db/_cache.db';
import { DBServerService } from '../services/core/db/_server.db';
import { DBSyncService } from '../services/core/db/sync.service';

// initiate db and auth in shared lib to be available throughout app
@NgModule({
  imports: [
    CommonModule,
    // note, due to AOT build issues not calling initialise but pass provider below
    // see https://github.com/angular/angularfire2/issues/1635
    AngularFireModule,
    AngularFirestoreModule,
    AngularFireAuthModule,
  ],
  providers: [{ provide: FIREBASE_OPTIONS, useValue: ENVIRONMENT.firebase }],
})
export class PicsaDbModule {
  static forRoot(): ModuleWithProviders<PicsaDbModule> {
    return {
      ngModule: PicsaDbModule,
      providers: [
        DBCacheService,
        DBServerService,
        DBSyncService,
        PicsaDbService,
      ],
    };
  }
}
