import { Injectable } from '@angular/core';

/**
 * TODO - cordova network plugin uses vpn which requires extra permissions
 * Should refactor if required to use capacitor netowrk
 */
// import { Network } from '@awesome-cordova-plugins/network/ngx';

import { Platform } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class NetworkProvider {
  private online = false;

  private network: any;
  // private network: Network

  constructor(private platform: Platform) {
    console.log('Hello NetworkProvider Provider');
  }
  private init() {
    console.error('Network not currently supported');
    return;
    // this.online = this.getNetworkStatus();
    // console.log('online?', this.online);
    // this.subscribeToNetworkChanges();
  }

  private getNetworkStatus() {
    if (this.platform.is('cordova')) {
      return this.network.type != 'none';
    } else {
      return navigator.onLine;
    }
  }

  private subscribeToNetworkChanges() {
    console.log('subscribing to network changes');
    if (this.platform.is('cordova')) {
      this.network.onDisconnect().subscribe(() => {
        this.online = false;
      });
      this.network.onConnect().subscribe(() => {
        this.online = true;
      });
    } else {
      window.addEventListener('online', (e) => this.updateOnlineStatus(e));
      window.addEventListener('offline', (e) => this.updateOnlineStatus(e));
    }
  }
  updateOnlineStatus(e) {
    this.online = true;
  }
  updateOfflineStatus(e) {
    this.online = false;
  }
}
