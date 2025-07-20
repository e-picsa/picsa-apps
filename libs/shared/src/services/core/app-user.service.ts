import { effect, Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { ConfigurationService } from '@picsa/configuration';

import { PicsaAsyncService } from '../asyncService.service';
import { SupabaseService } from './supabase';

export interface IAppUser {
  device_id: string;
  country: string;
  user_type: 'farmer' | 'extension';
  platform: 'web' | 'android';
}

@Injectable({ providedIn: 'root' })
export class AppUserService extends PicsaAsyncService {
  private isInitialized = false;

  constructor(private configurationService: ConfigurationService, private supabaseService: SupabaseService) {
    super();
    // Check if dependencies are available
    if (!this.configurationService) {
      return;
    }
    if (!this.supabaseService) {
      return;
    }
    effect(() => {
      const userSettings = this.configurationService.userSettings();
      if (!userSettings) {
        return;
      }
      if (!userSettings.country_code) {
        return;
      }
      if (!userSettings.user_type) {
        return;
      }
      this.updateUserProfile({
        country: userSettings.country_code,
        user_type: userSettings.user_type,
      }).catch((error) => {
        console.error('[AppUser] updateUserProfile failed:', error);
      });
    });
    this.isInitialized = true;
  }

  public override async init() {
    try {
      await this.supabaseService.ready();
    } catch (error) {
      console.error('[AppUser] Error during initialization:', error);
    }
  }

  public async updateUserProfile(update: Partial<IAppUser>) {
    await this.ready();
    const device_id = await this.getDeviceId();
    const platform = await this.getPlatform();
    const profileData = {
      device_id,
      platform,
      ...update,
    };
    const { data, error } = await this.supabaseService.db
      .table('app_users')
      .upsert(profileData, { onConflict: 'device_id' })
      .select();
    if (error) {
      console.error('[AppUser] Supabase error:', error);
      return null;
    }
    return data?.[0] as IAppUser;
  }

  private async getDeviceId(): Promise<string> {
    try {
      if (Capacitor.isNativePlatform()) {
        const { identifier } = await Device.getId();
        return identifier;
      }
    } catch (error) {
      console.error('[AppUser] Error getting native device ID:', error);
    }
    // Fallback to web device ID
    let webDeviceId = localStorage.getItem('picsa_web_device_id');
    if (!webDeviceId) {
      webDeviceId = 'web_' + Math.random().toString(36).substring(2);
      localStorage.setItem('picsa_web_device_id', webDeviceId);
    }
    return webDeviceId;
  }

  private async getPlatform(): Promise<'web' | 'android'> {
    try {
      if (Capacitor.isNativePlatform()) {
        const info = await Device.getInfo();
        if (info.platform === 'android') {
          return 'android';
        }
      }
    } catch (error) {
      console.error('[AppUser] Error getting device info:', error);
    }
    return 'web';
  }
}
