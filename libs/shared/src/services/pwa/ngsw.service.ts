import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { PicsaTranslateService } from '@picsa/i18n';

/**
 * @deprecated
 * Does not appear to currently be in use - can consider adding back in the future if optimised
 * web version desirable. Additional changes required
 * - Refactor ionic toastCtrl to mat component
 */
@Injectable({
  providedIn: 'root',
})
export class DEPRECATED_ServiceWorkerService {
  // want to use on all live sites as well as firebase production serve
  constructor(
    private swUpdate: SwUpdate,
    private translations: PicsaTranslateService,
  ) {}
  // callable initialisation as will likely depend on environment
  initialiseSw() {
    this._subscribeToUpdates();
  }

  /******************************************************************************************
   *  Private Methods
   *****************************************************************************************/
  private async promptUpdate() {
    // TODO - refactor
    const message = await this.translations.translateText(
      'New Update available! Reload this page to see the latest version.',
    );
    alert(message);
    // const toast = await this.toastCtrl.create({
    //   closeButtonText: 'Reload',
    //   message: message,
    //   showCloseButton: true,
    //   position: 'bottom',
    // });
    // await toast.present();
    // await toast.onDidDismiss();
    this.swUpdate.activateUpdate();
  }

  private async _listenForPushMessages() {
    // console.log("push enabled?", this.push.isEnabled);
  }
  private _subscribeToUpdates() {
    // TODO - refactor
    // this.swUpdate.available.subscribe((event) => {
    //   console.log('current version is', event.current);
    //   console.log('available version is', event.available);
    //   this.promptUpdate();
    // });
    // this.swUpdate.activated.subscribe((event) => {
    //   console.log('old version was', event.previous);
    //   console.log('new version is', event.current);
    //   location.reload();
    // });
  }
}
