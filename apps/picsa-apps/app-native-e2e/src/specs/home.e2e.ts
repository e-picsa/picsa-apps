import { $, expect } from '@wdio/globals';
import * as fs from 'fs';
import * as path from 'path';

import { PATHS } from '../constants';

describe('PICSA Native App', () => {
  it('should load the home screen', async () => {
    // Switch to webview
    await browser.switchToWebView();

    // Verify the app root component or specific element exists
    const appRoot = $('picsa-configuration-select');
    await appRoot.waitForExist({ timeout: 20000 });
    await expect(appRoot).toExist();

    // Capture screenshot
    const screenshotPath = PATHS.SCREENSHOTS;
    if (!fs.existsSync(screenshotPath)) {
      fs.mkdirSync(screenshotPath, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-');
    await driver.saveScreenshot(path.join(screenshotPath, `home-screen-${timestamp}.png`));
  });
});
