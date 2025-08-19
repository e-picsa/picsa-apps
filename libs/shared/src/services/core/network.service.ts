import { Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ConnectionStatus, Network } from '@capacitor/network';
import { _wait } from '@picsa/utils';
import { BehaviorSubject, filter, firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NetworkService {
  private networkStatus$ = new BehaviorSubject<ConnectionStatus>({ connected: false, connectionType: 'none' });

  public networkStatus = toSignal(this.networkStatus$);

  constructor() {
    Network.addListener('networkStatusChange', (status) => {
      this.networkStatus$.next(status);
    });
  }

  public isNetworkError(err: any) {
    return (
      err?.message?.includes('fetch') ||
      err?.message?.includes('network') ||
      err?.code === 'ECONNRESET' ||
      err?.code === 'ETIMEDOUT'
    );
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
        await this.waitUntilOnline();
        // Use jitter in case large number of users come back online simultaneously (e.g. event)
        await _wait(Math.random() * 500);
      }
    }
    // This should never be reached, but satisfies TypeScript
    throw new Error('retryOnNetworkError exited unexpectedly');
  }

  public async waitUntilOnline() {
    return firstValueFrom(this.networkStatus$.pipe(filter((v) => v.connected === true)));
  }
}
