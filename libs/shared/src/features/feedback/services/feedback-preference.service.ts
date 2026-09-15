import { Injectable, signal } from '@angular/core';

export const FEEDBACK_SHOW_FAB_STORAGE_KEY = 'picsa_feedback_show_fab';

@Injectable({ providedIn: 'root' })
export class FeedbackPreferenceService {
  public readonly showFloatingFab = signal<boolean>(this.loadPreference());

  public setShowFloatingFab(show: boolean): void {
    this.showFloatingFab.set(show);
    try {
      localStorage.setItem(FEEDBACK_SHOW_FAB_STORAGE_KEY, String(show));
    } catch {
      // localStorage may be unavailable or disabled
    }
  }

  /**
   * Called when a user opens the feedback menu item.
   * If the user has not explicitly configured a preference yet (null in localStorage),
   * default the floating button to true.
   */
  public enableOnFirstMenuOpen(): void {
    try {
      if (localStorage.getItem(FEEDBACK_SHOW_FAB_STORAGE_KEY) === null) {
        this.setShowFloatingFab(true);
      }
    } catch {
      // localStorage may be unavailable or disabled
    }
  }

  private loadPreference(): boolean {
    try {
      return localStorage.getItem(FEEDBACK_SHOW_FAB_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }
}
