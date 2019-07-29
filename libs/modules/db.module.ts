import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/core/auth.service';
import {
  DBCacheService,
  DBServerService,
  DBSyncService
} from '../services/core';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireAuthModule } from '@angular/fire/auth';
import ENVIRONMENT from '../environments/environment';

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
      providers: [DBCacheService, DBServerService, DBSyncService, AuthService]
    };
  }
}
