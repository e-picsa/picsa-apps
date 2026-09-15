import { Injectable, signal } from '@angular/core';

import type { TrendlinePeriod } from '../utils/statistics.utils';

@Injectable({ providedIn: 'root' })
export class TrendlineConfigService {
  /**
   * Analysis window:
   * - 'full': Complete available record (requires >= 20 observations and >= 70% completeness).
   * - '30_year': Recent 30-year climate normal window (requires >= 20 observations).
   */
  public readonly period = signal<TrendlinePeriod>('full');

  public setPeriod(period: TrendlinePeriod): void {
    this.period.set(period);
  }

  public reset(): void {
    this.period.set('full');
  }
}
