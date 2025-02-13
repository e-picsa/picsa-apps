import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { FirebasePerformance } from '@capacitor-firebase/performance';
import { FirebasePerformance as IFirebasePerformance, getPerformance } from '@firebase/performance';
import { ENVIRONMENT } from '@picsa/environments/src';

import { PicsaFirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
/**
 * Monitor app performance via firebase performance monitoring
 * https://firebase.google.com/docs/perf-mon/get-started-android
 * https://www.npmjs.com/package/@capacitor-firebase/performanceF
 * */
export class PerformanceService {
  private performance: IFirebasePerformance;

  constructor(private firebaseService: PicsaFirebaseService) {}

  public init() {
    if (Capacitor.isNativePlatform() && ENVIRONMENT.production) {
      this.performance = getPerformance(this.firebaseService.app);
    }
  }
  public startTrace = FirebasePerformance.startTrace;

  public stopTrace = async (traceName: string) => {
    await FirebasePerformance.stopTrace({ traceName });
  };

  public incrementMetric = FirebasePerformance.incrementMetric;

  public setEnabled = FirebasePerformance.setEnabled;

  public isEnabled = FirebasePerformance.isEnabled;
}
