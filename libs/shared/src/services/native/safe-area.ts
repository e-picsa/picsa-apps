import { Injectable } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface SafeAreaPlugin {
  getInsets(): Promise<SafeAreaInsets>;
}

// Safely register plugin only if on a native platform
const SafeArea = Capacitor.isNativePlatform() ? registerPlugin<SafeAreaPlugin>('SafeArea') : null;

@Injectable({
  providedIn: 'root',
})
export class SafeAreaService {
  /**
   * Retrieves the native safe area insets (status bar and navigation bar heights).
   * Gracefully returns zero insets if not running on a native device.
   */
  async getInsets(): Promise<SafeAreaInsets> {
    if (!Capacitor.isNativePlatform() || !SafeArea) {
      return { top: 0, bottom: 0, left: 0, right: 0 };
    }
    try {
      return await SafeArea.getInsets();
    } catch (error) {
      console.error('Error getting safe area insets:', error);
      return { top: 0, bottom: 0, left: 0, right: 0 };
    }
  }

  /**
   * Initializes safe area variables and applies them to the document element style.
   * Gracefully does nothing if not running on a native platform.
   */
  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    try {
      const insets = await this.getInsets();
      document.documentElement.style.setProperty('--safe-area-inset-top', `${insets.top}px`);
      document.documentElement.style.setProperty('--safe-area-inset-bottom', `${insets.bottom}px`);
      document.documentElement.style.setProperty('--safe-area-inset-left', `${insets.left}px`);
      document.documentElement.style.setProperty('--safe-area-inset-right', `${insets.right}px`);
    } catch (error) {
      console.error('Failed to apply safe area insets on startup:', error);
    }
  }
}
