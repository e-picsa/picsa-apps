import { $, expect } from '@wdio/globals';

import { STORAGE_KEYS } from '../constants';

describe('PICSA Native App - Storage Injection', () => {
  it('should load initial state from fixtures', async () => {
    // Load state from the fixture file we created
    // The custom command 'loadState' handles switching to WebView and path resolution
    await browser.loadState('initial-state.json');

    // Verify that the localStorage is actually set
    const storedSettings = await browser.execute((key) => {
      return window.localStorage.getItem(key);
    }, STORAGE_KEYS.USER_SETTINGS);

    expect(storedSettings).not.toBeNull();

    // Explicitly parse based on what we know we stored
    const settings = JSON.parse(storedSettings as string);
    expect(settings.country_code).toBe('zm');
    expect(settings.user_type).toBe('farmer');

    // Proceed to check if the UI reflects this state
    const farmerHome = $('farmer-home');
    await expect(farmerHome).toExist();
  });
});
