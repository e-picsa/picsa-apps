import { Injectable } from '@angular/core';
import { ENVIRONMENT } from '@picsa/environments';
import { CONFIGURATIONS } from './configurations';
import type { IConfiguration } from './types';

@Injectable({ providedIn: 'root' })
export class ConfigurationService {
  public activeConfiguration: IConfiguration.Settings;
  public configurationOptions: IConfiguration.Settings[];

  private userConfigOverrides = { id: ENVIRONMENT.defaultConfiguration };

  constructor() {
    this.loadActiveConfig();
  }

  getUserConfiguration(setting: keyof IConfiguration.Settings) {
    return this.activeConfiguration[setting];
  }

  setUserConfiguration(id: string) {
    if (id) {
      this.userConfigOverrides.id = id;
      this.storeUserConfiguration();
    }
  }

  public updateUserConfiguration(
    setting: keyof IConfiguration.Settings,
    value: any
  ) {
    const extracted = extractSelectedOptions(value);
    if (extracted) {
      this.userConfigOverrides[setting] = extracted;
      this.storeUserConfiguration();
    } else {
      console.log('no value to extract', value);
    }
  }
  private storeUserConfiguration() {
    const configuration = JSON.stringify(this.userConfigOverrides);
    localStorage.setItem('picsa_userConfig', configuration);
    this.loadActiveConfig();
  }

  private loadActiveConfig() {
    try {
      const storedConfig = JSON.parse(
        localStorage.getItem('picsa_userConfig') as any
      );
      if (storedConfig && storedConfig.id) {
        this.userConfigOverrides = storedConfig;
      }
    } catch (error) {}

    const { selected, options } = populateSelectedOptions(
      { options: CONFIGURATIONS, selected: undefined },
      this.userConfigOverrides
    );
    this.configurationOptions = options;
    this.activeConfiguration = selected as any;
    console.log('active config', this.activeConfiguration);
  }
}

/**
 * Global settings contain options that user can select from
 * Lookup any user selected options, and if they match replace option with selected
 */
function populateSelectedOptions<T extends { options?: any[]; selected?: any }>(
  data: T,
  userData: { id?: string } = {}
) {
  if (isObject(data)) {
    // First pass - replace any nested
    for (const [key, value] of Object.entries(data)) {
      if (isObject(value)) {
        data[key] = populateSelectedOptions(data[key], userData[key]);
      }
    }
    // Second pass - replace selected
    if (data.options) {
      data.selected = data.options![0];
      const foundOption = data.options!.find(
        (option: any) => option.id === userData.id
      );
      if (foundOption !== undefined) {
        data.selected = foundOption;
      }
      data.selected = populateSelectedOptions(data.selected, userData);
    }
  }
  return data;
}

/**
 * Inverse of populateSelectedOptions, takes input configuration and extracts a nested json
 * object containing only the selected ids of options
 */
function extractSelectedOptions(data: any) {
  const userSettings: any = {};
  if (isObject(data)) {
    // First pass - replace any nested
    for (const [key, value] of Object.entries(data)) {
      if (isObject(value)) {
        const extracted = extractSelectedOptions(data[key]);
        if (extracted) {
          userSettings[key] = extracted;
        }
      }
    }
    // Second pass - replace selected
    if (data.options && data.selected) {
      userSettings.id = data.selected.id;
    }
    if (Object.keys(userSettings).length === 0) return;
  }
  return userSettings;
}

function isObject(v: any) {
  return v && v.constructor === {}.constructor;
}
