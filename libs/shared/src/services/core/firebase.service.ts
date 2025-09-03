import { Injectable } from '@angular/core';
import { ENVIRONMENT } from '@picsa/environments';
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
