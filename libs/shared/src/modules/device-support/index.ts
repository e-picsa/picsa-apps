import { ModuleWithProviders, NgModule } from '@angular/core';

import { DeviceSupportService } from './device-support.service';
import { DeviceTroubleshooterComponent } from './device-troubleshooter/device-troubleshooter.component';

export { DeviceSupportService };

/**
 * Support module used to troubleshoot common device issues
 * 
 * The module should be imported `forRoot` in the main app module, e.g.
    ```
    NgModule({
      imports: [DeviceSupportModule.forRoot()],
    })
    export class AppModule
    ```
 * The module should be imported regularly for any lazy-loaded child modules 
 * 
 * Checks can be run via the included service
 * ```ts
 * deviceSupportService.checkDeviceCompatibility().then(()=>{
 *  deviceSupportService.showDeviceTroubleshooter()
 * })
 * ```
 */
@NgModule({
  imports: [],
  declarations: [DeviceTroubleshooterComponent],
})
export class PicsaDeviceSupportModule {
  static forRoot(): ModuleWithProviders<PicsaDeviceSupportModule> {
    return {
      ngModule: PicsaDeviceSupportModule,
      providers: [DeviceSupportService],
    };
  }
}
