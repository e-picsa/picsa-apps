import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterLink } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n';
import type { INotificationChannel } from '@picsa/models';
import { PicsaNotificationFeedService } from '@picsa/shared/services/core/notifications';
import { PicsaPushNotificationService } from '@picsa/shared/services/core/push-notifications.service';

interface IChannelConfig {
  key: INotificationChannel;
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'picsa-notification-preferences',
  templateUrl: './notification-preferences.page.html',
  styleUrls: ['./notification-preferences.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatSlideToggleModule, PicsaTranslateModule, RouterLink],
})
export class NotificationPreferencesPageComponent {
  public pushService = inject(PicsaPushNotificationService);
  public feedService = inject(PicsaNotificationFeedService);

  public permissionStatus = computed(() => this.pushService.permissionStatus());
  public channels = computed(() => this.feedService.preferences().channels);

  public readonly channelConfigs: IChannelConfig[] = [
    {
      key: 'weather_forecasts',
      title: 'Weather & Climate Alerts',
      description: 'Localized seasonal forecasts, dry spell warnings, and severe weather advisories.',
      icon: 'wb_sunny',
    },
    {
      key: 'agronomic_advisories',
      title: 'Agronomic Advisories',
      description: 'Crop management guidance, planting dates, and pest or disease warning updates.',
      icon: 'eco',
    },
    {
      key: 'app_updates',
      title: 'App Updates & Releases',
      description: 'New feature notifications, offline database sync alerts, and version updates.',
      icon: 'system_update',
    },
    {
      key: 'general_announcements',
      title: 'General Announcements',
      description: 'Community notices, workshops, agricultural surveys, and important service notices.',
      icon: 'campaign',
    },
  ];

  public async onRequestPermissions(): Promise<void> {
    await this.pushService.requestNotificationPermissions();
  }

  public async onToggleChannel(channel: INotificationChannel, enabled: boolean): Promise<void> {
    await this.feedService.updateChannelPreference(channel, enabled);
  }
}
