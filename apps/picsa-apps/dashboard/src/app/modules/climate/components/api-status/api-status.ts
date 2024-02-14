import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy } from '@angular/core';
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
}

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
export class DashboardClimateApiStatusComponent implements OnDestroy {
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

  @Input() options: IApiStatusOptions = {};

  /** Unique id of API request to monitor for status updates */
  @Input() set clientId(id: string) {
    // clear any previous subscription
    if (this.subscription) this.subscription.unsubscribe();
    // subscribe to any requests sent via client and update UI accordingly
    const client = this.api.getObservableClient(id);
    this.subscription = client.$.pipe(takeUntil(this.componentDestroyed$)).subscribe((response) => {
      this.status = this.getCallbackStatus(response?.status);
      // only assign success and error codes
      if (this.status === 'error' || this.status === 'success') {
        this.code = response?.status;
      }
      this.cdr.markForCheck();
      if (response && this.status === 'error') {
        this.showCustomFetchErrorMessage(id, response);
      }
    });
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
    // clone body so that open-api can still consume when constructing full fetch response
    const clone = response.clone();
    try {
      const json = await clone.json();
      const errorText = json.detail || 'failed, see console logs for details';
      this.notificationService.showUserNotification({ matIcon: 'error', message: `[${id}] ${errorText}` });
    } catch (error) {
      console.error(error);
      console.error('Fetch Error', error);
      this.notificationService.showUserNotification({
        matIcon: 'error',
        message: `[${id}] 'failed, see console logs for details'`,
      });
    }
  }
}
