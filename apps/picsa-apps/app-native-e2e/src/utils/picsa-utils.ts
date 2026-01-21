import { STORAGE_KEYS } from '../constants';
import { USER_SETTINGS, UserSettingName } from '../fixtures/initial-state';
import { setLocalStorage } from './wdio-commands';

/** Load named picsa config state to localstorage */
export async function loadPicsaConfig(settingName: UserSettingName) {
  await setLocalStorage({ [STORAGE_KEYS.USER_SETTINGS]: USER_SETTINGS[settingName] });
}
