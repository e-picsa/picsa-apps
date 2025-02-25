import { computed, effect, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { DEPLOYMENT_DATA_HASHMAP, ICountryCode, IDeploymentId, ILocaleCode } from '@picsa/data/deployments';
import { debounceTime } from 'rxjs';

export interface IUserSettings {
  /** ID of selected deployment configuration */
  deployment_id: IDeploymentId;
  /** Selected country */
  country_code: ICountryCode;
  /** ID of selected language */
  language_code: ILocaleCode;
  /** Specify if using farmer or extension app user_type */
  user_type: 'farmer' | 'extension';
  /**
   * User location, stored as an array to allow for hierarchy by osm admin level,
   * https://wiki.openstreetmap.org/wiki/Key:admin_level
   * @example [null,null,'malawi','northern','karonga']
   */
  location: (string | null)[];
}

const USER_CONFIGURATION_DEFAULT: IUserSettings = {
  country_code: null as any,
  deployment_id: null as any,
  language_code: null as any,
  user_type: null as any,
  location: [],
};

@Injectable({ providedIn: 'root' })
export class ConfigurationService {
  /** User-specific configuration */
  public userSettings = signal<IUserSettings>(USER_CONFIGURATION_DEFAULT);

  /** Deployment-specific configuration */
  public deploymentSettings = computed(() => {
    const { deployment_id } = this.userSettings();
    const deployment = DEPLOYMENT_DATA_HASHMAP[deployment_id] || DEPLOYMENT_DATA_HASHMAP.global;
    return deployment;
  });

  constructor() {
    this.enableLocalStorageSync();
    this.loadUserSettings();

    effect(() => {
      /** HACK - update theme on config change for extension version (better in own service) */
      const { theme } = this.deploymentSettings();
      const { user_type } = this.userSettings();
      if (user_type === 'extension' && theme) {
        document.body.dataset['theme'] = theme;
      } else {
        document.body.dataset['theme'] = 'picsa-default';
      }
    });

    effect(() => {
      // ensure sublocation kept in sync with country selected
      const { country_code, location } = this.userSettings();
      if (location[2] === country_code) return;
      this.userSettings.update((v) => ({ ...v, location: [null, null, country_code] }));
    });
  }

  public resetUserSettings() {
    this.userSettings.set(USER_CONFIGURATION_DEFAULT);
  }

  public updateUserSettings(update: Partial<IUserSettings>) {
    this.userSettings.set({ ...this.userSettings(), ...update });
  }

  /**
   * Automatically store user settings in localstorage on update
   * Use small debounce to avoid blocking UI if triggering multiple updates
   * **/
  private enableLocalStorageSync() {
    toObservable(this.userSettings)
      .pipe(debounceTime(1000))
      .subscribe((settings) => {
        localStorage.setItem('picsa_user_settings', JSON.stringify(settings));
      });
  }

  private loadUserSettings() {
    const storedSettings = localStorage.getItem('picsa_user_settings');
    // merge with defaults
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings) as IUserSettings;
      const merged = { ...USER_CONFIGURATION_DEFAULT };
      // TODO - consider safeguards/migrations to ensure compatible
      // TODO - consider using rxdb with user profile db entries instead of settings
      for (const [key, value] of Object.entries(parsed)) {
        merged[key] = value;
      }
      this.userSettings.set(merged);
    }
  }
}
