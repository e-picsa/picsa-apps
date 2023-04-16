import { Injectable } from '@angular/core';
import { FirebasePerformance } from '@capacitor-firebase/performance';
import {
  FirebasePerformance as IFirebasePerformance,
  getPerformance,
} from '@firebase/performance';

import { PicsaFirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
/**
 * Monitor app performance via firebase performance monitoring
 * https://firebase.google.com/docs/perf-mon/get-started-android
 * https://www.npmjs.com/package/@capacitor-firebase/performanceF
 * */
export class PerformanceService {
  private performance: IFirebasePerformance;

  constructor(firebaseService: PicsaFirebaseService) {
    this.performance = getPerformance(firebaseService.app);
  }
  public startTrace = FirebasePerformance.startTrace;

  public stopTrace = async (traceName: string) => {
    await FirebasePerformance.stopTrace({ traceName });
  };

  public incrementMetric = FirebasePerformance.incrementMetric;

  public setEnabled = FirebasePerformance.setEnabled;

  public isEnabled = FirebasePerformance.isEnabled;
}
