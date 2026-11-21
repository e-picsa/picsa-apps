import { Injector } from '@angular/core';
import { ConfigurationService, IUserLocationSelection, IUserSettings } from '@picsa/configuration/src';
import { ICountryCode } from '@picsa/data';
import { getGeoLocationData } from '@picsa/data/geoLocation';

import { IMigration } from '../types';

/** Legacy settings shape prior to per-country `locationsByCountry` map */
interface ILegacyUserSettings extends IUserSettings {
  location?: (string | undefined)[];
}

/**
 * Map a legacy `[undefined, undefined, cc, undefined, top, child]` tuple to a validated
 * keyed selection map for `countryCode`, dropping any unknown or parent-mismatched segments.
 */
export function convertLegacyLocationTuple(
  countryCode: ICountryCode,
  legacyLocation: (string | undefined)[] | undefined,
): IUserLocationSelection | undefined {
  if (!legacyLocation || legacyLocation.length <= 4) return undefined;
  if (legacyLocation[2] && legacyLocation[2] !== countryCode) return undefined;

  const { layers } = getGeoLocationData(countryCode);
  const selection: IUserLocationSelection = {};
  for (let i = 0; i < layers.length; i++) {
    const id = legacyLocation[4 + i];
    if (!id) break;
    const layer = layers[i];
    const match = layer.locations.find((l) => l.id === id);
    if (!match) break;
    if (i > 0) {
      const parentKey = layer.parentLayer ?? layers[i - 1].key;
      if (match.parentId !== selection[parentKey]) break;
    }
    selection[layer.key] = match.id;
  }
  return Object.keys(selection).length > 0 ? selection : undefined;
}

/**
 * One-time migration from legacy OSM-indexed `userSettings.location` tuple to
 * per-country `userSettings.locationsByCountry`.
 */
const migration: IMigration = {
  id: 20261121,
  label: 'Per-Country Location Selection',
  up: async (injector: Injector) => {
    const configurationService = injector.get(ConfigurationService);
    const settings = configurationService.userSettings() as ILegacyUserSettings;
    const { country_code, location } = settings;
    if (!location) {
      return { status: 'skipped', reason: 'no legacy location field' };
    }

    const targetCountry = (country_code || location[2]) as ICountryCode | undefined;
    const locationsByCountry = { ...(settings.locationsByCountry ?? {}) };
    const { location: legacyLocation, ...rest } = settings;
    const nextSettings: IUserSettings = {
      ...rest,
      locationsByCountry,
    };

    if (!targetCountry) {
      configurationService.userSettings.set(nextSettings);
      return { status: 'cleared', reason: 'no country_code available', from: legacyLocation };
    }

    if (locationsByCountry[targetCountry] && Object.keys(locationsByCountry[targetCountry]).length > 0) {
      configurationService.userSettings.set(nextSettings);
      return {
        status: 'skipped',
        reason: 'locationsByCountry already populated',
        country: targetCountry,
        kept: locationsByCountry[targetCountry],
      };
    }

    const migrated = convertLegacyLocationTuple(targetCountry, legacyLocation);
    if (migrated) {
      locationsByCountry[targetCountry] = migrated;
      configurationService.userSettings.set(nextSettings);
      return { status: 'migrated', country: targetCountry, from: legacyLocation, to: migrated };
    }

    configurationService.userSettings.set(nextSettings);
    return { status: 'cleared', country: targetCountry, from: legacyLocation, reason: 'no valid location segments' };
  },
  app_version: '5.24.0',
};

export default migration;
