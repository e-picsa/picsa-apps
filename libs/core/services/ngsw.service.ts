import { Injectable } from "@angular/core";
import ENVIRONMENT from "src/environments/environment";
import { ToastController } from "@ionic/angular";
import { SwUpdate } from "@angular/service-worker";
import { TranslationsProvider } from "./translations";

@Injectable({
  providedIn: "root"
})
export class ServiceWorkerService {
  // want to use on all live sites as well as firebase production serve
  constructor(
    private toastCtrl: ToastController,
    private swUpdate: SwUpdate,
    private translations: TranslationsProvider
  ) {}
  init() {
    if (ENVIRONMENT.production) {
      this._subscribeToUpdates();
    }
  }

  /******************************************************************************************
   *  Private Methods
   *****************************************************************************************/
  private async promptUpdate() {
    console.log("update available");
    const message = await this.translations.translateText(
      "New Update available! Reload this page to see the latest version."
    );
    const toast = await this.toastCtrl.create({
      closeButtonText: "Reload",
      message: message,
      showCloseButton: true,
      position: "bottom"
    });
    await toast.present();
    await toast.onDidDismiss();
    this.swUpdate.activateUpdate();
  }

  private async _listenForPushMessages() {
    // console.log("push enabled?", this.push.isEnabled);
  }
  private _subscribeToUpdates() {
    this.swUpdate.available.subscribe(event => {
      console.log("current version is", event.current);
      console.log("available version is", event.available);
      this.promptUpdate();
    });
    this.swUpdate.activated.subscribe(event => {
      console.log("old version was", event.previous);
      console.log("new version is", event.current);
      location.reload();
    });
  }
}
