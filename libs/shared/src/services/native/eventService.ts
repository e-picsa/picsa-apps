import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

@Injectable({ providedIn: 'root' })
export class NativeEventService {
  constructor() {
    this.addListeners;
  }

  public init() {
    this.addListeners();
  }

  private addListeners() {
    CapacitorApp.removeAllListeners();
    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          CapacitorApp.exitApp();
        } else {
          window.history.back();
        }
      });
    }
  }
}
