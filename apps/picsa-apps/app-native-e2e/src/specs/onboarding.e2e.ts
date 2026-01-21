import { $, expect } from '@wdio/globals';

import { takeScreenshot } from '../utils/driver-utils';

describe('PICSA Native App', () => {
  it('should load the configuration select', async () => {
    // Switch to webview
    await browser.switchToWebView();

    // Verify the app root component or specific element exists
    const appRoot = $('picsa-configuration-select');
    await appRoot.waitForExist({ timeout: 20000 });
    await expect(appRoot).toExist();

    await takeScreenshot('onboarding');
  });
});
