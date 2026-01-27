import { $, expect } from '@wdio/globals';

import { takeScreenshot } from '../utils/driver-utils';

describe('PICSA Native App - Home', () => {
  before(async function () {
    await browser.switchToWebView();
  });
  it('should load initial state from fixtures', async () => {
    // Before hook in setup should have populated localstorage state
    // Proceed to check if the UI reflects this state
    const farmerHome = $('farmer-home');
    await expect(farmerHome).toExist();

    await takeScreenshot('farmer-home');
  });
});
