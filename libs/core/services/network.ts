import { Injectable } from "@angular/core";
import { Network } from "@ionic-native/network/ngx";
import { Platform } from "@ionic/angular";

@Injectable({ providedIn: "root" })
export class NetworkProvider {
  online: boolean;

  constructor(private network: Network, private platform: Platform) {
    console.log("Hello NetworkProvider Provider");
  }
  init() {
    this.online = this.getNetworkStatus();
    console.log("online?", this.online);
    this.subscribeToNetworkChanges();
  }

  getNetworkStatus() {
    if (this.platform.is("cordova")) {
      return this.network.type != "none";
    } else {
      return navigator.onLine;
    }
  }

  subscribeToNetworkChanges() {
    console.log("subscribing to network changes");
    if (this.platform.is("cordova")) {
      this.network.onDisconnect().subscribe(() => {
        this.online = false;
      });
      this.network.onConnect().subscribe(() => {
        this.online = true;
      });
    } else {
      window.addEventListener("online", e => this.updateOnlineStatus(e));
      window.addEventListener("offline", e => this.updateOnlineStatus(e));
    }
  }
  updateOnlineStatus(e) {
    this.online = true;
  }
  updateOfflineStatus(e) {
    this.online = false;
  }

  updateReduxOnlineStatus() {}
}
