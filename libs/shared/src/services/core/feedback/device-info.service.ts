import { inject, Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { TranslateService } from '@ngx-translate/core';
import { APP_VERSION } from '@picsa/environments/src/version';

import { NetworkService } from '../network.service';

@Injectable({ providedIn: 'root' })
export class DeviceInfoService {
  private networkService = inject(NetworkService);
  private translateService = inject(TranslateService);

  async collect(): Promise<Record<string, string | undefined>> {
    const t = (v: string | undefined, max = 64): string | undefined => {
      if (v == null) return undefined;
      return v.length > max ? v.slice(0, max) : v;
    };

    const info: Record<string, string | undefined> = {
      app_version: t(APP_VERSION),
      screen_size: t(`${window.screen.width}x${window.screen.height}`),
      network_status: t(this.networkService.isOnline() ? 'online' : 'offline'),
      locale: t(this.translateService.currentLang || navigator.language),
    };

    if (Capacitor.isNativePlatform()) {
      try {
        const deviceInfo = await Device.getInfo();
        info.os = t(deviceInfo.platform);
        info.os_version = t(deviceInfo.osVersion);
        info.device_model = t(deviceInfo.model);
      } catch {
        info.os = 'unknown';
      }
      try {
        const id = await Device.getId();
        info.device_id = t(id.identifier);
      } catch {
        // device id unavailable - omit
      }
    } else {
      info.os = t(navigator.platform || 'web');
      info.os_version = t(navigator.userAgent);
    }

    return info;
  }
}
