import { computed, effect, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { DEPLOYMENT_DATA_HASHMAP, IDeploymentId, ILanguageCode } from '@picsa/data/deployments';
import { ENVIRONMENT } from '@picsa/environments';
import { debounceTime } from 'rxjs';

export interface IUserSettings {
  /** ID of selected deployment configuration */
  deployment_id: IDeploymentId;
  /** ID of selected language */
  language_code: ILanguageCode;
  /** Specify if using farmer or extension app variants */
  variant: 'farmer' | 'extension';
  first_load: boolean;
}

const USER_CONFIGURATION_DEFAULT: IUserSettings = {
  deployment_id: ENVIRONMENT.deploymentDefault,
  language_code: 'en',
  variant: 'extension',
  first_load: true,
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
      /** HACK - update theme on config change (better in own service) */
      document.body.dataset['theme'] = this.deploymentSettings().theme;
    });
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
    console.log('loading user settings');
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
