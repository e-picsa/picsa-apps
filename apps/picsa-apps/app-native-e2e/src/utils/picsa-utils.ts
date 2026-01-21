import { USER_SETTINGS, UserSettingName } from '../fixtures/initial-state';
import { setLocalStorage } from './wdio-commands';

/** Load named picsa config state to localstorage */
export async function loadPicsaConfig(settingName: UserSettingName) {
  await setLocalStorage({ picsa_user_settings: USER_SETTINGS[settingName] });
}
