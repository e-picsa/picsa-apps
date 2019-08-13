import {
  NgModule,
  ModuleWithProviders,
  Optional,
  SkipSelf
} from '@angular/core';
import { PrintProvider } from '../services/native/print';
import { NetworkProvider } from '../services/native/network';
import { PicsaFileService } from '../services/native/file-service';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';
import { File } from '@ionic-native/file/ngx';
import { FileOpener } from '@ionic-native/file-opener/ngx';

@NgModule({
  imports: []
})
export class PicsaNativeModule {
  constructor(@Optional() @SkipSelf() parentModule: PicsaNativeModule) {
    if (parentModule) {
      throw new Error(
        'PicsaNativeServices is already loaded. Import it in the AppModule only'
      );
    }
  }
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: PicsaNativeModule,
      providers: [
        PrintProvider,
        NetworkProvider,
        PicsaFileService,
        SocialSharing,
        File,
        FileOpener
      ]
    };
  }
}
