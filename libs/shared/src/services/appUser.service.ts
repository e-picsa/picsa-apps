import { computed, effect, Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ConfigurationService } from '@picsa/configuration';
import { Database } from '@picsa/server-types';
import { debounceSignal } from '@picsa/utils/angular';
import { isEqual } from '@picsa/utils/object.utils';
import { v4 as uuidv4 } from 'uuid';

import { NetworkService } from './core/network.service';
import { SupabaseService } from './core/supabase/supabase.service';
import { PicsaSyncService } from './syncService.service';

const USER_ID_KEY = 'picsa_app_user_id';

type IAppUser = Database['public']['Tables']['app_users'];

/**
 * Handle sync between local appUser data and db app_user table
 *
 * TODO
 * - Row level security (ensure read/write own profile only)
 */
@Injectable({ providedIn: 'root' })
export class AppUserService extends PicsaSyncService {
  private dbProfile = signal<IAppUser['Row'] | undefined>(undefined);

  private platform = Capacitor.getPlatform();

  private userProfile = computed<IAppUser['Insert']>(
    () => {
      const { country_code, language_code, user_type } = this.configurationService.userSettings();
      return { id: this.appUserId, country_code, language_code, user_type, platform: this.platform };
    },
    { equal: isEqual },
  );

  private appUserId = localStorage.getItem(USER_ID_KEY) || this.generateId();

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
  ) {
    super();

    // When user is online attempt to load profile from DB (create if does not exist)
    effect(async () => {
      const isOnline = this.networkService.isOnline();
      if (isOnline && !this.dbProfile()) {
        const dbProfile = await this.loadDbUserProfile();
        if (dbProfile) {
          this.dbProfile.set(dbProfile);
        } else {
          await this.createUserProfile();
        }
      }
    });

    // When user is online attempt sync pending update
    effect(async () => {
      const isOnline = this.networkService.isOnline();
      const pendingUpdate = this.pendingDBUpdateDebounded();
      if (isOnline && pendingUpdate) {
        await this.updateUserProfile();
      }
    });
  }

  private generateId() {
    const id = uuidv4();
    localStorage.setItem(USER_ID_KEY, id);
    return id;
  }

  private async loadDbUserProfile() {
    await this.supabaseService.ready();
    const { data, error } = await this.table.select('*').eq('id', this.appUserId).maybeSingle();
    if (error) throw error;
    return data;
  }

  private async createUserProfile() {
    const userProfile = this.userProfile();
    const { data, error } = await this.table.insert(userProfile).select().single();
    if (error) throw error;
    if (data) {
      console.log('[App User] profile created', data);
      this.dbProfile.set(data);
    }
  }

  private async updateUserProfile() {
    const userProfile = this.userProfile();
    const dbProfile = this.dbProfile();

    const update = this.generateDBUpdate(userProfile, dbProfile || {});
    if (Object.keys(update).length === 0) return;

    const { data, error } = await this.table.update(update).eq('id', this.appUserId).select().single();
    if (error) throw error;
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
