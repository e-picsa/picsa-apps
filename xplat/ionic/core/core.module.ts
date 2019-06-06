import { NgModule, Optional, SkipSelf } from '@angular/core';

import { IonicModule } from '@ionic/angular';
import { throwIfAlreadyLoaded } from '@picsa/utils';
import { FooCoreModule } from '@picsa/web';

@NgModule({
  imports: [FooCoreModule, IonicModule.forRoot()]
})
export class FooIonicCoreModule {
  constructor(
    @Optional()
    @SkipSelf()
    parentModule: FooIonicCoreModule
  ) {
    throwIfAlreadyLoaded(parentModule, 'FooIonicCoreModule');
  }
}
