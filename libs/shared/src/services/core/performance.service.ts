import { Injectable } from '@angular/core';
import { FirebasePerformance } from '@capacitor-firebase/performance';

@Injectable({ providedIn: 'root' })
/**
 * Monitor app performance via firebase performance monitoring
 * https://firebase.google.com/docs/perf-mon/get-started-android
 * https://www.npmjs.com/package/@capacitor-firebase/performance
 * */
export class PerformanceService {
  public startTrace = FirebasePerformance.startTrace;

  public stopTrace = async (traceName: string) => {
    await FirebasePerformance.stopTrace({ traceName });
  };

  public incrementMetric = FirebasePerformance.incrementMetric;

  public setEnabled = FirebasePerformance.setEnabled;

  public isEnabled = FirebasePerformance.isEnabled;
}
