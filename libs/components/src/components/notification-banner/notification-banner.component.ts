import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { PicsaPushNotificationService } from '@picsa/shared/services/core/push-notifications.service';
import { filter, Subject, takeUntil } from 'rxjs';

export interface IAppNotificationItem {
  id: string;
  title: string;
  message: string;
  icon?: string;
  actionLabel?: string;
  actionType?: 'permission_request' | 'link';
}

export const NOTIFICATION_BANNER_STORAGE_KEY = 'picsa_notification_banner_dismissed';

export const DEFAULT_UPDATE_NOTIFICATION: IAppNotificationItem = {
  id: 'request_push_permission',
  title: 'Allow Regular Updates',
  message: 'Enable notifications to stay informed with weather alerts and PICSA updates.',
  icon: 'notifications_active',
  actionLabel: 'Allow Updates',
  actionType: 'permission_request',
};

const HOME_PAGE_PATHS = new Set(['/', '', '/farmer', '/extension']);

@Component({
  selector: 'picsa-notification-banner',
  templateUrl: './notification-banner.component.html',
  styleUrls: ['./notification-banner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, PicsaTranslateModule],
})
export class PicsaNotificationBannerComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private pushNotificationService = inject(PicsaPushNotificationService);
  private notificationService = inject(PicsaNotificationService);
  private destroyed$ = new Subject<void>();

  public homeOnly = input<boolean>(true);
  public notification = input<IAppNotificationItem>(DEFAULT_UPDATE_NOTIFICATION);

  public permissionRequested = output<boolean>();
  public dismissed = output<string>();

  public isDismissed = signal<boolean>(this.checkDismissed());
  public currentUrl = signal<string>(this.router.url ?? '/');

  public isHome = computed(() => {
    const rawUrl = this.currentUrl().split('?')[0];
    return HOME_PAGE_PATHS.has(rawUrl);
  });

  public visible = computed(() => {
    if (this.isDismissed()) {
      return false;
    }
    if (this.homeOnly() && !this.isHome()) {
      return false;
    }
    const item = this.notification();
    if (item.actionType === 'permission_request') {
      if (this.pushNotificationService.isPermissionGranted()) {
        return false;
      }
      if (this.pushNotificationService.permissionStatus() === 'denied') {
        return false;
      }
    }
    return true;
  });

  ngOnInit() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntil(this.destroyed$),
      )
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects || event.url);
      });
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  public async onActionClicked(item: IAppNotificationItem): Promise<void> {
    if (item.actionType === 'permission_request') {
      const granted = await this.pushNotificationService.requestNotificationPermissions();
      this.permissionRequested.emit(granted);
      if (granted) {
        this.notificationService.showSuccessNotification('Notifications enabled');
      }
      this.dismissBanner(false);
    }
  }

  public onDismissClicked(): void {
    this.dismissBanner(true);
  }

  private dismissBanner(persist: boolean): void {
    this.isDismissed.set(true);
    if (persist) {
      try {
        localStorage.setItem(NOTIFICATION_BANNER_STORAGE_KEY, 'true');
      } catch {
        // ignore localStorage errors
      }
    }
    this.dismissed.emit(this.notification().id);
  }

  private checkDismissed(): boolean {
    try {
      return localStorage.getItem(NOTIFICATION_BANNER_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }
}
