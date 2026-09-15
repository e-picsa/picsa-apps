import { computed, effect, inject, Injectable, isDevMode, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ConfigurationService } from '@picsa/configuration';
import { APP_VERSION } from '@picsa/environments/src/version';
import { Database } from '@picsa/server-types';
import { debounceSignal } from '@picsa/utils/angular';
import { isEqual } from '@picsa/utils/object.utils';

import { ErrorHandlerService } from './error-handler.service';
import { NetworkService } from './network.service';
import { SupabaseService } from './supabase/supabase.service';

type IAppUser = Database['public']['Tables']['app_users'];

const INTERNAL_TESTER_STORAGE_KEY = 'picsa_is_internal_tester';

/**
 * Handle sync between local appUser data and db app_user table
 * This is a 1-way push, where local config is source of truth
 * and simply updates row in DB on change
 */
@Injectable({ providedIn: 'root' })
export class AppUserService {
  private configurationService = inject(ConfigurationService);
  private supabaseService = inject(SupabaseService);
  private networkService = inject(NetworkService);
  private errorService = inject(ErrorHandlerService);

  public enabled = signal(false);

  /** User supabase auth_user id as db only allows user to write to own row */
  public userId = computed(() => this.supabaseService.auth.authUser()?.id);

  private dbProfile = signal<IAppUser['Row'] | undefined>(undefined);

  private platform = Capacitor.getPlatform();

  private fcmToken = signal<string | null>(null);
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

    // When user is online attempt to load profile from DB (create if does not exist)
    effect(async () => {
      if (!this.enabled()) return;
      if (!this.shouldTrackUser()) return;
      await this.supabaseService.ready();
      if (!this.supabaseService.isAvailable()) return;
      const userId = this.userId();
      const isOnline = this.networkService.isOnline();
      if (isOnline && userId && !this.dbProfile()) {
        const dbProfile = await this.loadDbUserProfile(userId);
        if (dbProfile) {
          this.dbProfile.set(dbProfile);
          if (dbProfile.fcm_token_updated_at && !this.fcmTokenUpdatedAt()) {
            this.fcmTokenUpdatedAt.set(dbProfile.fcm_token_updated_at);
          }
          if (dbProfile.is_internal_tester && !this.internalTesterSignal()) {
            this.setInternalTester(true, false);
          }
        } else {
          await this.createUserProfile(userId);
        }
      }
    });

    // When user is online attempt sync pending update
    effect(async () => {
      if (!this.enabled()) return;
      if (!this.shouldTrackUser()) return;
      await this.supabaseService.ready();
      if (!this.supabaseService.isAvailable()) return;
      const userId = this.userId();
      const isOnline = this.networkService.isOnline();
      const pendingUpdate = this.pendingDBUpdateDebounded();
      if (isOnline && userId && pendingUpdate) {
        await this.updateUserProfile(userId);
      }
    });
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
    if (!this.supabaseService.isAvailable()) return;
    const userProfile = this.userProfile();
    const { data, error } = await this.table
      .insert({ ...userProfile, user_id })
      .select('*')
      .single();
    if (error) {
      this.errorService.handleError(error);
    }
    if (data) {
      console.log('[App User] profile created', data);
      this.dbProfile.set(data);
    }
  }

  private async updateUserProfile(user_id: string) {
    if (!this.supabaseService.isAvailable()) return;
    const userProfile = this.userProfile();
    const dbProfile = this.dbProfile();

    const update = this.generateDBUpdate(userProfile, dbProfile || {});
    if (Object.keys(update).length === 0) return;
    const { data, error } = await this.table.update(update).eq('user_id', user_id).select().single();
    if (error) {
      this.errorService.handleError(error);
    }
    if (data) {
      console.log('[App User] profile updated', update);
      this.dbProfile.set(data);
    }
  }

  private generateDBUpdate(userProfile: Partial<IAppUser['Row']>, dbProfile: Partial<IAppUser['Row']>) {
    const update: IAppUser['Update'] = {};
    for (const [key, value] of Object.entries(userProfile)) {
      if (!isEqual(value, dbProfile[key])) {
        update[key] = value;
      }
    }
    return update;
  }

  /** Only track in app_users on native platforms or if user is authenticated (non-anonymous) */
  private shouldTrackUser(): boolean {
    if (Capacitor.isNativePlatform()) {
      return true;
    }
    const authUser = this.supabaseService.auth.authUser();
    return Boolean(authUser && !authUser.is_anonymous);
  }

  public setFcmToken(token: string) {
    if (this.fcmToken() !== token) {
      console.log('[App User] Setting FCM Token');
      this.fcmToken.set(token);
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
        // ignore storage errors
      }
    }
  }

  private loadInternalTesterSetting(): boolean {
    try {
      const stored = localStorage.getItem(INTERNAL_TESTER_STORAGE_KEY);
      if (stored !== null) {
        return stored === 'true';
      }
    } catch {
      // ignore storage errors
    }
    return isDevMode();
  }
}
