import { Injectable, signal } from '@angular/core';

export const TRANSLATION_DEBUG_STORAGE_KEY = 'picsa_translation_debug';
const QUERY_PARAM = 'translationDebug';
const DISABLED_VALUES = ['0', 'false', 'off'];

/**
 * Opt-in debug mode that marks untranslated strings in the UI.
 *
 * Enable via `?translationDebug=1` (or `0` to disable). The setting is persisted
 * to localStorage so it survives reloads and can be toggled from internal UI.
 */
@Injectable({ providedIn: 'root' })
export class PicsaTranslateDebugService {
  public readonly enabled = signal(this.resolveInitialState());

  public setEnabled(enabled: boolean): void {
    this.enabled.set(enabled);
    writeStorage(enabled);
  }

  private resolveInitialState(): boolean {
    const queryValue = readQueryParam();
    if (queryValue === null) {
      return readStorage();
    }
    // Bare `?translationDebug` enables, explicit 0/false/off disables
    const enabled = !DISABLED_VALUES.includes(queryValue.toLowerCase());
    writeStorage(enabled);
    return enabled;
  }
}

function readQueryParam(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return new URLSearchParams(window.location.search).get(QUERY_PARAM);
}

function readStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(TRANSLATION_DEBUG_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeStorage(enabled: boolean): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TRANSLATION_DEBUG_STORAGE_KEY, String(enabled));
    }
  } catch {
    // Storage can be unavailable in private browsing modes
  }
}
