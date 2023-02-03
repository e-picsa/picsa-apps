import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ENVIRONMENT } from '@picsa/environments/src';
import { FirebaseApp, initializeApp } from 'firebase/app';

@Injectable({ providedIn: 'root' })
export class PicsaFirebaseService {
  public app: FirebaseApp;
  constructor() {
    // if (!Capacitor.isNativePlatform()) {
    this.app = initializeApp(ENVIRONMENT.firebase);
    // }
  }
}
