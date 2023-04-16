import {
  ModuleWithProviders,
  NgModule,
  Optional,
  SkipSelf,
} from '@angular/core';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { FileOpener } from '@awesome-cordova-plugins/file-opener/ngx';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';

import { PicsaFileService } from '../services/native/file-service';
import { NetworkProvider } from '../services/native/network';
import { PrintProvider } from '../services/native/print';

@NgModule({
  imports: [],
})
export class PicsaNativeModule {
  constructor(@Optional() @SkipSelf() parentModule: PicsaNativeModule) {
    if (parentModule) {
      throw new Error(
        'PicsaNativeServices is already loaded. Import it in the AppModule only'
      );
    }
  }
  static forRoot(): ModuleWithProviders<PicsaNativeModule> {
    return {
      ngModule: PicsaNativeModule,
      providers: [
        PrintProvider,
        NetworkProvider,
        PicsaFileService,
        SocialSharing,
        File,
        FileOpener,
      ],
    };
  }
}
