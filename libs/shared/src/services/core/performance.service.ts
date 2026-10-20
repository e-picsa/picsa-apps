import { Injectable } from '@angular/core';
import { FirebasePerformance } from '@capacitor-firebase/performance';

/**
 * Monitor app performance via firebase performance monitoring.
 * Calls are delegated to the native Capacitor plugin, which is the supported
 * integration for native builds.
 * https://firebase.google.com/docs/perf/get-started
 * https://www.npmjs.com/package/@capacitor-firebase/performance
 */
@Injectable({ providedIn: 'root' })
export class PerformanceService {
  public startTrace = FirebasePerformance.startTrace;

  public stopTrace = async (traceName: string) => {
    await FirebasePerformance.stopTrace({ traceName });
  };

  public incrementMetric = FirebasePerformance.incrementMetric;

  public setEnabled = FirebasePerformance.setEnabled;

  public isEnabled = FirebasePerformance.isEnabled;
}
