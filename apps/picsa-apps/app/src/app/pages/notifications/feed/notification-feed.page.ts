import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n';
import type { INotificationChannel, INotificationEntry } from '@picsa/models';
import { PicsaNotificationFeedService } from '@picsa/shared/services/core/notifications';

@Component({
  selector: 'picsa-notification-feed',
  templateUrl: './notification-feed.page.html',
  styleUrls: ['./notification-feed.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatButtonModule, MatCardModule, MatChipsModule, MatIconModule, PicsaTranslateModule, RouterLink],
})
export class NotificationFeedPageComponent {
  public feedService = inject(PicsaNotificationFeedService);

  public filterMode = signal<'all' | 'unread'>('all');

  public notifications = computed(() => {
    const list = this.feedService.activeNotifications();
    if (this.filterMode() === 'unread') {
      return list.filter((n) => !n.readAt);
    }
    return list;
  });

  public unreadCount = computed(() => this.feedService.unreadCount());

  public async onExecuteAction(entry: INotificationEntry, type: 'primary' | 'secondary'): Promise<void> {
    await this.feedService.executeAction(entry, type);
  }

  public async onDismiss(id: string): Promise<void> {
    await this.feedService.dismissNotification(id);
  }

  public async onMarkAllAsRead(): Promise<void> {
    await this.feedService.markAllAsRead();
  }

  public async onSeedDevSamples(): Promise<void> {
    await this.feedService.seedDevSamples();
  }

  public getChannelIcon(channel: INotificationChannel): string {
    switch (channel) {
      case 'weather_forecasts':
        return 'wb_sunny';
      case 'agronomic_advisories':
        return 'eco';
      case 'app_updates':
        return 'system_update';
      case 'general_announcements':
      default:
        return 'campaign';
    }
  }

  public getChannelLabel(channel: INotificationChannel): string {
    switch (channel) {
      case 'weather_forecasts':
        return 'Forecast';
      case 'agronomic_advisories':
        return 'Advisory';
      case 'app_updates':
        return 'App Update';
      case 'general_announcements':
      default:
        return 'Announcement';
    }
  }
}
