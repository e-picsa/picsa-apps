import { effect, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Network } from '@capacitor/network';
import { _wait } from '@picsa/utils';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  fromEvent,
  interval,
  merge,
  Observable,
  startWith,
  switchMap,
} from 'rxjs';

const NETWORK_ERR_CODES = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'];
const NETWORK_ERR_MESSAGES = ['fetch', 'network'];

@Injectable({ providedIn: 'root' })
export class NetworkService {
  /** Online status observable, with debounce and unique pipes to handle flaky connections */
  private isOnline$ = this.setupOnlineListeners();

  public isOnline = toSignal(this.isOnline$);

  constructor() {
    effect(() => {
      if (this.isOnline() !== undefined) {
        console.log('[Network]', this.isOnline() ? 'Online' : 'Offline');
      }
    });
  }

  public async waitForConnectivity() {
    return firstValueFrom(this.isOnline$.pipe(filter((isOnline) => isOnline)));
  }

  /**
   * Attempt an operation that may throw error if not online, and retry when online presence detected
   *
   * @param operation Function that includes error throw when not online (e.g. remote db op, http request)
   * @param maxRetries Maximum number of retries if repeated fail even when network detected
   * @param minDelayMs Min amount of time to wait before retrying even when network detected
   * @returns
   */
  public async retryOnNetworkError<T>(operation: () => Promise<T>, maxRetries = 5, minDelayMs = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await operation();
        return res;
      } catch (err: any) {
        if (!this.isNetworkError(err) || attempt === maxRetries) {
          throw err; // rethrow if not retryable or max retries reached
        }

        console.warn(`[Network] Operation failed. Retrying when network detected...`);

        // Use exponential backoff in case network flapping
        const delay = Math.min(minDelayMs * Math.pow(2, attempt - 1), 30000);
        await _wait(delay);
        await this.waitForConnectivity();
        // Use jitter in case large number of users come back online simultaneously (e.g. event)
        await _wait(Math.random() * 500);
      }
    }
    // This should never be reached, but satisfies TypeScript
    throw new Error('retryOnNetworkError exited unexpectedly');
  }

  /**
   * Use combination of capacitor network api, window events and interval polling
   * to try and reliably detect changes in internet connectivity
   */
  private setupOnlineListeners() {
    const network$ = new Observable((subscriber) => {
      Network.addListener('networkStatusChange', () => subscriber.next());
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

  private isNetworkError(err: any) {
    return (
      NETWORK_ERR_CODES.includes(err?.code) ||
      NETWORK_ERR_MESSAGES.some((msg) => err?.message?.includes(msg)) ||
      err?.name === 'AbortError' // Request timeout
    );
  }

  private async checkConnectivity(): Promise<boolean> {
    // If network not connected assume offline
    const { connected } = await Network.getStatus();
    if (!connected) return false;

    // Perform lightweiight web request to check if internet available

    // TODO
    // possibly better to use own backend service/function in case internet provider
    // provides free/whitelisted access to specific domain under control (e.g. Internet of Good Things)
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
