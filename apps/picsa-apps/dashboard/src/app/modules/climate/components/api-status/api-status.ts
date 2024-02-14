import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
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
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './api-status.html',
  styleUrls: ['./api-status.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardClimateApiStatusComponent implements OnInit, OnDestroy {
  public status: IStatus = 'pending';
  public code?: number;

  private componentDestroyed$ = new Subject();
  private subscription: Subscription;

  constructor(
    public api: ClimateApiService,
    public service: ClimateService,
    private notificationService: PicsaNotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  @Input() options: Partial<IApiStatusOptions> = {};

  /** Unique id of API request to monitor for status updates */
  @Input() set clientId(id: string) {
    // clear any previous subscription
    if (this.subscription) this.subscription.unsubscribe();
    // subscribe to any requests sent via client and update UI accordingly
    const client = this.api.getObservableClient(id);
    this.subscription = client.$.pipe(takeUntil(this.componentDestroyed$)).subscribe(async (response) => {
      this.status = this.getCallbackStatus(response?.status);
      // only assign success and error codes
      if (this.status === 'error' || this.status === 'success') {
        this.code = response?.status;
      }
      this.cdr.markForCheck();
      if (response && this.status === 'error') {
        this.showCustomFetchErrorMessage(id, response);
      }
      // console log response body (debug purposes)
      if (response && this.status === 'success') {
        const resJson = await this.getResponseBodyJson(response);
        console.log(`[API] ${id}`, resJson);
      }
    });
  }
  ngOnInit() {
    this.options = { ...DEFAULT_OPTIONS, ...this.options };
  }
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
    const resJson = await this.getResponseBodyJson(response);
    const errorText = resJson.detail || 'failed, see console logs for details';
    console.error(response);
    this.notificationService.showUserNotification({ matIcon: 'error', message: `[${id}] ${errorText}` });
  }

  private async getResponseBodyJson(response: Response) {
    // clone body so that open-api can still consume when constructing full fetch response
    const clone = response.clone();
    try {
      const json = await clone.json();
      return json;
    } catch (error) {
      console.error('Response body parse error', error);
      return {};
    }
  }
}
