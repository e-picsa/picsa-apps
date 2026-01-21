import { IUserSettings } from '@picsa/configuration';

export const USER_SETTINGS = {
  farmer_zm: {
    country_code: 'zm',
    deployment_id: 'zm',
    language_code: 'zm_en',
    user_type: 'farmer',
    location: [undefined, undefined, 'zm'],
    climate_tool: {
      station_id: '',
    },
  } satisfies IUserSettings,
  extension_mw: {
    country_code: 'mw',
    deployment_id: 'mw',
    language_code: 'mw_en',
    user_type: 'extension',
    location: [undefined, undefined, 'mw'],
    climate_tool: {
      station_id: '',
    },
  } satisfies IUserSettings,
};

export type UserSettingName = keyof typeof USER_SETTINGS;
