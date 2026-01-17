import { inject,ModuleWithProviders, NgModule } from '@angular/core';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { FileOpener } from '@awesome-cordova-plugins/file-opener/ngx';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';

import { PrintProvider } from '../services/native/print';

@NgModule({
  imports: [],
})
export class PicsaNativeModule {
  constructor() {
    const parentModule = inject(PicsaNativeModule, { optional: true, skipSelf: true });

    if (parentModule) {
      throw new Error('PicsaNativeServices is already loaded. Import it in the AppModule only');
    }
  }
  static forRoot(): ModuleWithProviders<PicsaNativeModule> {
    return {
      ngModule: PicsaNativeModule,
      providers: [PrintProvider, SocialSharing, File, FileOpener],
    };
  }
}
