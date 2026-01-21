import { $, expect } from '@wdio/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('PICSA Native App', () => {
  it('should load the home screen', async () => {
    // Wait for the app to load and potential splash screen to disappear
    // Look for the webview context to indicate the app is ready
    await driver.waitUntil(
      async () => {
        const contexts = await driver.getContexts();
        return contexts.length > 1; // Usually NATIVE_APP + WEBVIEW_...
      },
      { timeout: 30000, timeoutMsg: 'Webview context was not found. App might not have loaded.' },
    );

    const contexts = await driver.getContexts();
    // Switch to the webview context
    const webviewContext = contexts.find((c) => typeof c === 'string' && c.toUpperCase().includes('WEBVIEW'));

    if (webviewContext) {
      await driver.switchContext(webviewContext as string);
    }

    // Verify the app root component or specific element exists
    const appRoot = $('picsa-configuration-select');
    await appRoot.waitForExist({ timeout: 20000 });
    await expect(appRoot).toExist();

    // Capture screenshot
    const screenshotPath = path.join(__dirname, '../../screenshots');
    if (!fs.existsSync(screenshotPath)) {
      fs.mkdirSync(screenshotPath, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-');
    await driver.saveScreenshot(path.join(screenshotPath, `home-screen-${timestamp}.png`));
  });
});
