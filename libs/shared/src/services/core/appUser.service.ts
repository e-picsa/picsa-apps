import { computed, effect, Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ConfigurationService } from '@picsa/configuration';
import { Database } from '@picsa/server-types';
import { debounceSignal } from '@picsa/utils/angular';
import { isEqual } from '@picsa/utils/object.utils';

import { ErrorHandlerService } from './error-handler.service';
import { NetworkService } from './network.service';
import { SupabaseService } from './supabase/supabase.service';

type IAppUser = Database['public']['Tables']['app_users'];

/**
 * Handle sync between local appUser data and db app_user table
 * This is a 1-way push, where local config is source of truth
 * and simply updates row in DB on change
 */
@Injectable({ providedIn: 'root' })
export class AppUserService {
  public enabled = signal(false);

  private dbProfile = signal<IAppUser['Row'] | undefined>(undefined);

  private platform = Capacitor.getPlatform();

  /** User supabase auth_user id as db only allows user to write to own row */
  private userId = computed(() => this.supabaseService.auth.authUser()?.id);

  private userProfile = computed<IAppUser['Insert']>(
    () => {
      const { country_code, language_code, user_type } = this.configurationService.userSettings();
      return { user_id: this.userId() as string, country_code, language_code, user_type, platform: this.platform };
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

  constructor(
    private configurationService: ConfigurationService,
    private supabaseService: SupabaseService,
    private networkService: NetworkService,
    private errorService: ErrorHandlerService,
  ) {
    // Ensure auth user signed in
    effect(async () => {
      await this.supabaseService.ready();
      if (this.enabled() && this.networkService.isOnline() && !this.userId()) {
        await this.supabaseService.auth.signInDefaultUser();
      }
    });

    // When user is online attempt to load profile from DB (create if does not exist)
    effect(async () => {
      if (!this.enabled()) return;
      const userId = this.userId();
      const isOnline = this.networkService.isOnline();
      if (isOnline && userId && !this.dbProfile()) {
        const dbProfile = await this.loadDbUserProfile(userId);
        if (dbProfile) {
          this.dbProfile.set(dbProfile);
        } else {
          await this.createUserProfile();
        }
      }
    });

    // When user is online attempt sync pending update
    effect(async () => {
      if (!this.enabled()) return;
      const userId = this.userId();
      const isOnline = this.networkService.isOnline();
      const pendingUpdate = this.pendingDBUpdateDebounded();
      if (isOnline && userId && pendingUpdate) {
        await this.updateUserProfile(userId);
      }
    });
  }

  private async loadDbUserProfile(userId: string) {
    const { data, error } = await this.table.select('*').eq('user_id', userId).maybeSingle();
    if (error) {
      this.errorService.handleError(error);
    }
    return data;
  }

  private async createUserProfile() {
    const userProfile = this.userProfile();
    const { data, error } = await this.table.insert(userProfile).select().single();
    if (error) {
      this.errorService.handleError(error);
    }
    if (data) {
      console.log('[App User] profile created', data);
      this.dbProfile.set(data);
    }
  }

  private async updateUserProfile(userId: string) {
    const userProfile = this.userProfile();
    const dbProfile = this.dbProfile();

    const update = this.generateDBUpdate(userProfile, dbProfile || {});
    if (Object.keys(update).length === 0) return;

    const { data, error } = await this.table.update(update).eq('user_id', userId).select().single();
    if (error) {
      this.errorService.handleError(error);
    }
    if (data) {
      console.log('[App User] profile synced', update);
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
}
