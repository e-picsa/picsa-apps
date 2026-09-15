import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'picsa_feedback_show_fab';

@Injectable({ providedIn: 'root' })
export class FeedbackPreferenceService {
  public readonly showFloatingFab = signal<boolean>(this.loadPreference());

  public setShowFloatingFab(show: boolean): void {
    this.showFloatingFab.set(show);
    try {
      localStorage.setItem(STORAGE_KEY, String(show));
    } catch {
      // localStorage may be unavailable or disabled
    }
  }

  private loadPreference(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }
}
