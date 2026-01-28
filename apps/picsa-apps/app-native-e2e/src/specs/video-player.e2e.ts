import { $, browser, expect } from '@wdio/globals';

import { takeScreenshot } from '../utils/driver-utils';
import { skipOnLegacyDevices } from '../utils/version-utils';

/**
 * yarn wdio run wdio.conf.ts --spec src/specs/video-player.e2e.ts
 */
describe('Video Player', () => {
  before(async function () {
    skipOnLegacyDevices(this);
  });
  it('should play videos using local override', async () => {
    await browser.appNavigateTo('farmer/intro');

    const downloadButton = await $('.download-button-inner');
    await expect(downloadButton).toExist({ wait: 15000 });
    await downloadButton.waitForClickable({ timeout: 5000, interval: 1000 });
    await downloadButton.click();

    const playButton = await $('.play-button');
    await expect(playButton).toExist({ wait: 5000 });

    await playButton.click();

    await browser.pause(4000);

    // Switch to native context to capture the video overlay
    const currentContext = await browser.getContext();
    await browser.switchContext('NATIVE_APP');
    await takeScreenshot('video-playing');

    if (currentContext && typeof currentContext === 'string') {
      await browser.switchContext(currentContext);
    }
  });
});
