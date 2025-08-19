import { computed, effect, Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ConfigurationService } from '@picsa/configuration';
import { Database } from '@picsa/server-types';
import { isEqual } from '@picsa/utils/object.utils';
import { v4 as uuidv4 } from 'uuid';

import { PicsaAsyncService } from './asyncService.service';
import { NetworkService } from './core/network.service';
import { SupabaseService } from './core/supabase/supabase.service';

const USER_ID_KEY = 'picsa_app_user_id';

type IAppUser = Database['public']['Tables']['app_users'];

/**
 * TODO
 * - Row level security (ensure read/write own profile only)
 */

@Injectable({ providedIn: 'root' })
export class AppUserService extends PicsaAsyncService {
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

  /** Timer used to debounce sync */
  private syncTimer: any = null;

  /** Amount of time waited before syncing, to allow batching multiple changes */
  private readonly SYNC_DEBOUNCE_MS = 5000;

  constructor(
    private configurationService: ConfigurationService,
    private supabaseService: SupabaseService,
    private networkService: NetworkService,
  ) {
    super();

    effect(() => {
      // sync user profile when user updated (if initial db profile also loaded)
      const userProfile = this.userProfile();
      const dbProfile = this.dbProfile();
      if (userProfile && dbProfile) {
        this.scheduleSync();
      }
    });
  }

  public override async init(): Promise<void> {
    // Load user profile from DB (create if not exists)
    // Do not await as exponential backoff could take long time
    this.networkService
      .retryOnNetworkError(() => this.loadDbUserProfile(), 30)
      .then((data) => {
        if (data) {
          this.dbProfile.set(data);
        } else {
          // No DB user - sync from local which will populate initial db entry
          this.scheduleSync();
        }
      })
      .catch((error) => {
        // Failed to load from db despite network retries - ignore sync
        console.error(error);
      });
  }

  private generateId() {
    const id = uuidv4();
    localStorage.setItem(USER_ID_KEY, id);
    return id;
  }

  /**
   * Load the current user profile from the database
   * Retries in case of no internet connectivity
   */
  private async loadDbUserProfile() {
    await this.supabaseService.ready();
    const { data, error } = await this.table.select('*').eq('id', this.appUserId).maybeSingle();
    if (error) {
      // Throw error to be handled by network retry
      throw error;
    }
    return data;
  }

  private scheduleSync() {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }
    this.syncTimer = setTimeout(() => {
      this.syncUserProfile();
      this.syncTimer = null;
    }, this.SYNC_DEBOUNCE_MS);
  }

  private async syncUserProfile() {
    const userProfile = this.userProfile();
    const dbProfile = this.dbProfile();

    if (dbProfile) {
      return this.networkService.retryOnNetworkError(() => this.updateUserProfile(userProfile, dbProfile));
    } else {
      return this.networkService.retryOnNetworkError(() => this.createUserProfile(userProfile));
    }
  }

  private async createUserProfile(userProfile: IAppUser['Insert']) {
    console.log('[App User] create profile');
    const { data, error } = await this.table.insert(userProfile).select().single();
    if (error) {
      // Throw error to be handled by network retry
      throw error;
    }
    if (data) {
      this.dbProfile.set(data);
    }
  }

  private async updateUserProfile(userProfile: IAppUser['Update'], dbProfile: IAppUser['Row']) {
    const update = this.generateDBUpdate(userProfile, dbProfile);
    if (Object.keys(update).length === 0) return;
    console.log('[App User] sync profile');
    const { data, error } = await this.table.update(update).eq('id', this.appUserId).select().single();
    if (error) {
      // Throw error to be handled by network retry
      throw error;
    }
    if (data) {
      this.dbProfile.set(data);
    }
  }

  private generateDBUpdate(userProfile: Partial<IAppUser['Row']>, dbProfile: Partial<IAppUser['Row']>) {
    const update: IAppUser['Update'] = {};

    // only check for changes in user profile
    for (const [key, value] of Object.entries(userProfile)) {
      if (!isEqual(value, dbProfile[key])) {
        update[key] = value;
      }
    }

    return update;
  }
}
