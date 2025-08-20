import { effect, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Network } from '@capacitor/network';
import { debounceTime, distinctUntilChanged, fromEvent, interval, merge, Observable, startWith, switchMap } from 'rxjs';

const NETWORK_ERR_CODES = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'];
const NETWORK_ERR_MESSAGES = ['fetch', 'network'];

@Injectable({ providedIn: 'root' })
export class NetworkService {
  /** Online status observable, with debounce and unique pipes to handle flaky connections */
  private isOnline$ = this.setupOnlineListeners();

  /** Signal to track online status, for use in effects */
  public isOnline = toSignal(this.isOnline$);

  constructor() {
    effect(() => {
      if (this.isOnline() !== undefined) {
        console.log('[Network]', this.isOnline() ? 'Online' : 'Offline');
      }
    });
  }

  /** Determine if an error message is likely a network error issue */
  public isNetworkError(err: any) {
    return (
      NETWORK_ERR_CODES.includes(err?.code) ||
      NETWORK_ERR_MESSAGES.some((msg) => err?.message?.includes(msg)) ||
      err?.name === 'AbortError' // Request timeout
    );
  }

  /**
   * Use combination of capacitor network api, window events and interval polling
   * to try and reliably detect changes in internet connectivity
   */
  private setupOnlineListeners() {
    const network$ = new Observable((subscriber) => {
      const listener = Network.addListener('networkStatusChange', () => subscriber.next());
      return () => listener.then((l) => l.remove());
    });
    const online$ = fromEvent(window, 'online');
    const offline$ = fromEvent(window, 'offline');

    const events = merge(network$, online$, offline$, interval(60 * 5000));

    // Combine events from all sources and debounce to avoid duplicate checks
    return events.pipe(
      startWith(null),
      debounceTime(500), // debounce to avoid frequent checks in flaky connections
      switchMap(() => this.checkConnectivity()), // check online status when triggered
      distinctUntilChanged(), // only emit a new value if status changed
    );
  }

  private async checkConnectivity(): Promise<boolean> {
    // If network not connected assume offline
    const { connected } = await Network.getStatus();
    if (!connected) return false;

    // Perform lightweight web request to check if internet available
    // This will typically use about 0.1-0.3KB per request when online,
    // depending on whether connection treated as new or not

    // TODO
    // possibly better to use own backend service/function in case internet provider
    // provides free/whitelisted access to specific domain under control (e.g. Internet of Good Things)
    // Also would have custom control over https keep-alive minimise new connection data overhead
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 5000); // 5s timeout, if online should receive response by then
      // Use httpbin endpoint to test HEAD request to check internet connectivity (cors-friendly)
      const res = await fetch('https://httpbin.org/status/204', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
