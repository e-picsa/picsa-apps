import { computed, effect, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { DEPLOYMENT_DATA_HASHMAP, ICountryCode, IDeploymentId, ILocaleCode } from '@picsa/data/deployments';
import { isEqual } from '@picsa/utils/object.utils';
import { debounceTime } from 'rxjs';

export type IUserLocationSelection = Record<string, string>;

export interface IUserSettings {
  /** ID of selected deployment configuration */
  deployment_id: IDeploymentId;
  /** Selected country */
  country_code: ICountryCode;
  /** ID of selected language */
  language_code: ILocaleCode;
  /** Specify if using farmer or extension app user_type */
  user_type: 'farmer' | 'extension';
  /** Per-country location selections keyed by geo layer (e.g. `{ zm: { province: 'southern', district: 'mazabuka' } }`) */
  locationsByCountry?: Partial<Record<ICountryCode, IUserLocationSelection>>;
  /** Selected station for the climate tool */
  climate_tool?: {
    station_id: string;
  };
}

const USER_CONFIGURATION_DEFAULT: IUserSettings = {
  country_code: null as any,
  deployment_id: null as any,
  language_code: null as any,
  user_type: null as any,
  locationsByCountry: {},
  climate_tool: { station_id: '' },
};

@Injectable({ providedIn: 'root' })
export class ConfigurationService {
  /** User-specific configuration */
  public userSettings = signal<IUserSettings>(USER_CONFIGURATION_DEFAULT);

  /** Active country's saved location selection (preserved across country switches) */
  public activeLocationSelection = computed<IUserLocationSelection>(
    () => {
      const { country_code, locationsByCountry } = this.userSettings();
      return (country_code ? locationsByCountry?.[country_code] : undefined) ?? {};
    },
    { equal: isEqual },
  );

  /** Deployment-specific configuration */
  public deploymentSettings = computed(() => {
    const { deployment_id } = this.userSettings();
    const deployment = DEPLOYMENT_DATA_HASHMAP[deployment_id] || DEPLOYMENT_DATA_HASHMAP.global;
    return deployment;
  });
  private theme = computed(() => this.deploymentSettings().theme);
  private userType = computed(() => this.userSettings().user_type);

  constructor() {
    this.enableLocalStorageSync();
    this.loadUserSettings();

    effect(async () => {
      /** HACK - update theme on config change for extension version (better in own service) */
      const theme = this.theme();
      const userType = this.userType();
      if (userType === 'extension' && theme) {
        document.body.dataset['theme'] = theme;
      } else {
        document.body.dataset['theme'] = 'picsa-default';
      }
    });
  }

  public resetUserSettings() {
    this.userSettings.set(USER_CONFIGURATION_DEFAULT);
  }

  public updateUserSettings(update: Partial<IUserSettings>) {
    this.userSettings.set({ ...this.userSettings(), ...update });
  }

  /** Save a country's location selection while preserving selections for other countries */
  public setLocationSelection(selection: IUserLocationSelection, countryCode?: ICountryCode) {
    const current = this.userSettings();
    const targetCountry = countryCode ?? current.country_code;
    if (!targetCountry) return;
    this.userSettings.set({
      ...current,
      locationsByCountry: {
        ...(current.locationsByCountry ?? {}),
        [targetCountry]: { ...selection },
      },
    });
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
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings) as IUserSettings;
      const merged = { ...USER_CONFIGURATION_DEFAULT };
      for (const [key, value] of Object.entries(parsed)) {
        merged[key] = value;
      }
      this.userSettings.set(merged);
    }
  }
}
