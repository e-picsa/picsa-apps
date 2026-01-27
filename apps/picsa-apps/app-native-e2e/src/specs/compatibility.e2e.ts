import { browser } from '@wdio/globals';

import { skipOnModernDevices } from '../utils/version-utils';

describe('Compatibility Check', () => {
  before(async function () {
    // Ensure we are in the webview context
    await browser.switchToWebView();
    skipOnModernDevices(this);
  });

  it('should display the update prompt on restricted devices', async () => {
    // Navigate to home to trigger the check
    await browser.appNavigateTo('en/');

    // The prompt is added to the body with id 'updatePrompt'
    const prompt = await $('#updatePrompt');
    await prompt.waitForExist({ timeout: 5000 });

    const heading = await prompt.$('h2');
    await expect(heading).toHaveText('Update Required');

    const button = await prompt.$('button=Go To Play Store');
    await expect(button).toExist();
  });
});
