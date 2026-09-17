import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ConfigurationService } from '@picsa/configuration';
import { APP_VERSION } from '@picsa/environments/src/version';
import { IAppUser } from '@picsa/server-types';
import { debounceSignal } from '@picsa/utils/angular';
import isEqual from 'lodash/isEqual';

import { ErrorHandlerService } from './error-handler.service';
import { NetworkService } from './network.service';
import { SupabaseService } from './supabase/supabase.service';

const INTERNAL_TESTER_STORAGE_KEY = 'picsa_is_internal_tester';

/**
 * Sync user profile to `app_users` table
 * NOTE - Currently anonymous users not supported in table so only sync if user
 * authenticated
 */
@Injectable({
  providedIn: 'root',
})
export class AppUserService {
  private configurationService = inject(ConfigurationService);
  private supabaseService = inject(SupabaseService);
  private errorService = inject(ErrorHandlerService);
  private networkService = inject(NetworkService);

  /** User supabase auth_user id as db only allows user to write to own row */
  public userId = computed(() => this.supabaseService.auth.authUser()?.id);

  private dbProfile = signal<IAppUser['Row'] | undefined>(undefined);

  private platform = Capacitor.getPlatform();

  private fcmTokenSignal = signal<string | null>(null);
  public fcmToken = computed(() => this.fcmTokenSignal());
  private fcmTokenUpdatedAt = signal<string | null>(null);
  private internalTesterSignal = signal<boolean>(this.loadInternalTesterSetting());

  public isInternalTester = computed(() => this.internalTesterSignal());

  private userProfile = computed<Omit<IAppUser['Insert'], 'user_id'>>(
    () => {
      const { country_code, language_code, user_type } = this.configurationService.userSettings();
      const app_version = APP_VERSION;
      return {
        country_code,
        language_code,
        user_type,
        platform: this.platform,
        app_version,
        fcm_token: this.fcmToken(),
        fcm_token_updated_at: this.fcmTokenUpdatedAt(),
        is_internal_tester: this.internalTesterSignal(),
      };
    },
    { equal: isEqual },
  );

  private get table() {
    return this.supabaseService.db.table('app_users');
  }

  /** Determine if profile sync required if online db profile differs from local */
  private pendingDBUpdate = computed(() => {
    const userProfile = this.userProfile();
    const dbProfile = this.dbProfile();
    if (userProfile && dbProfile) {
      const update = this.generateDBUpdate(userProfile, dbProfile);
      return Object.keys(update).length > 0 ? update : null;
    }
    return null;
  });

  /** Debounce profile update db writes  */
  private pendingDBUpdateDebounded = debounceSignal(this.pendingDBUpdate, 5000, null);

  constructor() {
    // Ensure auth user signed in (native platform only for anonymous users to prevent web user table bloat)
    effect(async () => {
      if (!this.enabled()) return;
      await this.supabaseService.ready();
      if (!this.supabaseService.isAvailable()) return;
      const isOnline = this.networkService.isOnline();
      const userId = this.userId();
      if (isOnline && !userId && Capacitor.isNativePlatform()) {
        await this.supabaseService.auth.signInAppUserOrAnonymous();
      }
    });

    // When signed-in and connected try to load db profile
    effect(async () => {
      if (!this.enabled()) return;
      await this.supabaseService.ready();
      if (!this.supabaseService.isAvailable()) return;
      const userId = this.userId();
      const isOnline = this.networkService.isOnline();
      if (isOnline && userId && !this.dbProfile()) {
        await this.syncDbProfile(userId);
      }
    });

    // When profile changes attempt sync to DB
    effect(async () => {
      if (!this.enabled()) return;
      await this.supabaseService.ready();
      if (!this.supabaseService.isAvailable()) return;
      const pendingUpdate = this.pendingDBUpdateDebounded();
      if (pendingUpdate) {
        await this.updateUserProfile(pendingUpdate);
      }
    });
  }

  private async syncDbProfile(userId: string) {
    const dbProfile = await this.loadDbUserProfile(userId);
    if (!dbProfile) {
      await this.createUserProfile(userId);
      return;
    }
    this.dbProfile.set(dbProfile);
    if (dbProfile.fcm_token && !this.fcmToken()) {
      this.fcmTokenSignal.set(dbProfile.fcm_token);
    }
    if (dbProfile.fcm_token_updated_at && !this.fcmTokenUpdatedAt()) {
      this.fcmTokenUpdatedAt.set(dbProfile.fcm_token_updated_at);
    }
    if (dbProfile.is_internal_tester && !this.internalTesterSignal()) {
      this.setInternalTester(true, false);
    }
  }

  private async loadDbUserProfile(user_id: string) {
    if (!this.supabaseService.isAvailable()) return null;
    const { data, error } = await this.table.select('*').eq('user_id', user_id).maybeSingle();
    if (error) {
      this.errorService.handleError(error);
    }
    return data;
  }

  private async createUserProfile(user_id: string) {
    const userProfile = this.userProfile();
    const { data, error } = await this.table
      .insert({
        ...userProfile,
        user_id,
      })
      .select('*')
      .single();
    if (error) {
      this.errorService.handleError(error);
    }
    if (data) {
      console.log('[App User] profile created');
      this.dbProfile.set(data);
    }
  }

  private async updateUserProfile(update: Partial<IAppUser['Update']>) {
    const userId = this.userId();
    if (!userId) return;
    const { data, error } = await this.table.update(update).eq('user_id', userId).select('*').single();
    if (error) {
      this.errorService.handleError(error);
    }
    if (data) {
      this.dbProfile.set(data);
    }
  }

  private generateDBUpdate(
    userProfile: Omit<IAppUser['Insert'], 'user_id'>,
    dbProfile: IAppUser['Row'],
  ): Partial<IAppUser['Update']> {
    const update: Partial<IAppUser['Update']> = {};
    for (const [key, value] of Object.entries(userProfile)) {
      if (value !== null && value !== undefined && value !== dbProfile[key]) {
        update[key] = value;
      }
    }
    return update;
  }

  /**
   * Only authenticated users currently have write access to table
   * Can support anonymous in future if required
   */
  private enabled() {
    if (!this.supabaseService.isAvailable()) {
      return false;
    }
    const authUser = this.supabaseService.auth.authUser();
    return Boolean(authUser && !authUser.is_anonymous);
  }

  public setFcmToken(token: string) {
    if (this.fcmToken() !== token) {
      console.log('[App User] Setting FCM Token');
      this.fcmTokenSignal.set(token);
      this.fcmTokenUpdatedAt.set(new Date().toISOString());
    }
  }

  public toggleInternalTester(): boolean {
    const nextVal = !this.internalTesterSignal();
    this.setInternalTester(nextVal, true);
    return nextVal;
  }

  public setInternalTester(value: boolean, persistToStorage = true) {
    this.internalTesterSignal.set(value);
    if (persistToStorage) {
      try {
        localStorage.setItem(INTERNAL_TESTER_STORAGE_KEY, String(value));
      } catch {
        // ignore localStorage errors
      }
    }
  }

  private loadInternalTesterSetting(): boolean {
    try {
      return localStorage.getItem(INTERNAL_TESTER_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }
}
