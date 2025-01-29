import { ChangeDetectionStrategy, Component, effect, input, OnDestroy, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RefreshSpinnerComponent } from '@picsa/components';
import { Subject, Subscription, takeUntil } from 'rxjs';

import { ClimateService } from '../../climate.service';
import { ClimateApiService } from '../../climate-api.service';

export type IStatus = 'pending' | 'success' | 'error' | 'ready';

export interface IApiStatusOptions {
  labels?: {
    ready?: string;
    error?: string;
  };
  events?: {
    refresh?: () => void;
  };
  showStatusCode?: boolean;
}
const DEFAULT_OPTIONS: IApiStatusOptions = {
  showStatusCode: true,
};

/**
 * Component used to display status of ongoing API requests
 * ```
 * <dashboard-climate-api-status clientId='myRequest' />
 * ```
 */
@Component({
  selector: 'dashboard-climate-api-status',
  imports: [MatButtonModule, MatIconModule, RefreshSpinnerComponent],
  templateUrl: './api-status.html',
  styleUrls: ['./api-status.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardClimateApiStatusComponent implements OnDestroy {
  public status = signal<IStatus>('pending');
  public code = signal<number>(0);

  private componentDestroyed$ = new Subject();
  private subscription: Subscription;

  constructor(public api: ClimateApiService, public service: ClimateService) {
    effect(() => {
      const id = this.clientId();
      // clear any previous subscription
      if (this.subscription) this.subscription.unsubscribe();
      // subscribe to any requests sent via client and update UI accordingly
      const client = this.api.getObservableClient(id);
      this.subscription = client.$.pipe(takeUntil(this.componentDestroyed$)).subscribe(async (response) => {
        const status = this.getCallbackStatus(response?.status);
        this.status.set(status);
        // only assign success and error codes
        if (status === 'error' || status === 'success') {
          this.code.set(response?.status || 0);
        }
        if (response && status === 'error') {
          this.showCustomFetchErrorMessage(id, response);
        }
        // console log response body (debug purposes)
        if (response && status === 'success') {
          const body = await this.parseResponseBody(response);
          console.log(`[API] ${id}`, body);
        }
      });
    });
  }

  options = input({}, { transform: (v: Partial<IApiStatusOptions> = {}) => ({ ...DEFAULT_OPTIONS, ...v }) });

  /** Unique id of API request to monitor for status updates */
  clientId = input.required<string>();

  ngOnDestroy(): void {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  private getCallbackStatus(statusCode?: number): IStatus {
    if (!statusCode) return 'ready';
    if (100 <= statusCode && statusCode <= 199) return 'pending';
    if (200 <= statusCode && statusCode <= 299) return 'success';
    if (400 <= statusCode && statusCode <= 599) return 'error';
    return 'ready';
  }

  /** Show error message when using custom fetch with callbacks */
  private async showCustomFetchErrorMessage(id: string, response: Response) {
    const body = await this.parseResponseBody(response);
    const errorText = body.detail || 'failed, see console logs for details';
    throw new Error(`[${id}] ${errorText}`);
  }

  /**
   * Parse response body and format as JSON, nesting blob and text content types as custom properties
   * in cases where response is not json type
   */
  private async parseResponseBody(response: Response): Promise<Record<string, any>> {
    // if (!response.bodyUsed) return {};
    const clone = response.clone();
    const contentType = response.headers.get('content-type');
    switch (contentType) {
      case 'application/json':
        return clone.json();
      case 'application/pdf': {
        const blob = await clone.blob();
        return { blob };
      }
      default: {
        console.warn('No parser for response content', contentType);
        const text = await clone.text();
        return { text };
      }
    }
  }
}
