import { Injectable } from '@angular/core';
import { ENVIRONMENT } from '@picsa/environments';
import { CONFIGURATIONS } from './configurations';
import type { IConfiguration } from './types';

@Injectable({ providedIn: 'root' })
export class ConfigurationService {
  private _activeConfiguration: IConfiguration;

  constructor() {
    const activeConfigId = localStorage.getItem('picsa_activeConfiguration');
    this.setActiveConfiguration(
      activeConfigId || ENVIRONMENT.defaultConfiguration
    );
    const userSettings = localStorage.getItem('picsa_userSettings');
    if (userSettings) {
      this.updateUserSettings(JSON.parse(userSettings));
    }
  }

  get activeConfiguration() {
    return this._activeConfiguration;
  }

  public updateUserSettings(settings: Partial<IConfiguration['userSettings']>) {
    localStorage.setItem('picsa_userSettings', JSON.stringify(settings));
    this._activeConfiguration.userSettings = {
      ...this._activeConfiguration.userSettings,
      ...settings,
    };
    // TODO - deep-merge update
  }

  private setActiveConfiguration(id: string) {
    const configuration: IConfiguration = CONFIGURATIONS[id];
    if (configuration !== undefined) {
      localStorage.setItem('picsa_activeConfiguration', id);
      this._activeConfiguration = configuration;
    }
  }
}
