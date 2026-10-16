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

@Injectable({
  providedIn: 'root',
})
export class AppUserService {
  private supabaseService = inject(SupabaseService);
  private configurationService = inject(ConfigurationService);
  private errorService = inject(ErrorHandlerService);
  private networkService = inject(NetworkService);

  public enabled = signal(false);

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
    effect(() => {
      if (!this.enabled()) return;
      const isOnline = this.networkService.isOnline();
      const userId = this.userId();
      if (!isOnline || userId || !Capacitor.isNativePlatform()) return;

      void (async () => {
        await this.supabaseService.ready();
        if (!this.supabaseService.isAvailable()) return;
        await this.supabaseService.auth.signInAppUserOrAnonymous();
      })().catch((err) => this.errorService.handleError(err));
    });

    // When signed-in and connected try to load db profile
    effect(() => {
      if (!this.enabled() || !this.shouldTrackUser()) return;
      const userId = this.userId();
      const isOnline = this.networkService.isOnline();
      const hasDbProfile = Boolean(this.dbProfile());
      if (!isOnline || !userId || hasDbProfile) return;

      void (async () => {
        await this.supabaseService.ready();
        if (!this.supabaseService.isAvailable()) return;
        await this.syncDbProfile(userId);
      })().catch((err) => this.errorService.handleError(err));
    });

    // When profile changes attempt sync to DB
    effect(() => {
      if (!this.enabled() || !this.shouldTrackUser()) return;
      const isOnline = this.networkService.isOnline();
      const pendingUpdate = this.pendingDBUpdateDebounded();
      if (!isOnline || !pendingUpdate) return;

      void (async () => {
        await this.supabaseService.ready();
        if (!this.supabaseService.isAvailable()) return;
        await this.updateUserProfile(pendingUpdate);
      })().catch((err) => this.errorService.handleError(err));
    });
  }

  private async syncDbProfile(userId: string) {
    const dbProfile = await this.loadDbUserProfile(userId);
    if (!dbProfile) {
      await this.createUserProfile(userId);
      return;
    }
    this.dbProfile.set(dbProfile);
    if (dbProfile.fcm_token) {
      if (dbProfile.fcm_token === this.fcmToken()) {
        // Token in DB is the same as locally received token: preserve DB timestamp to avoid unnecessary sync
        if (dbProfile.fcm_token_updated_at) {
          this.fcmTokenUpdatedAt.set(dbProfile.fcm_token_updated_at);
        }
      } else if (!this.fcmToken()) {
        this.fcmTokenSignal.set(dbProfile.fcm_token);
        if (dbProfile.fcm_token_updated_at) {
          this.fcmTokenUpdatedAt.set(dbProfile.fcm_token_updated_at);
        }
      }
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
      const dbVal = dbProfile[key as keyof IAppUser['Row']];
      const normLocal = value === undefined ? null : value;
      const normDb = dbVal === undefined ? null : dbVal;
      if (!isEqual(normLocal, normDb)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (update as any)[key] = value;
      }
    }
    return update;
  }

  /** Only track in app_users on native platforms to prevent web user table bloat */
  private shouldTrackUser(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Update FCM token for push notifications and record timestamp.
   * If token is already equal to current or restored token, skips update.
   */
  public setFcmToken(token: string) {
    if (this.fcmToken() !== token) {
      console.log('[App User] Updating FCM token');
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
