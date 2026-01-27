import { $, browser, expect } from '@wdio/globals';
import * as fs from 'fs';
import { join } from 'path';

import { takeScreenshot } from '../utils/driver-utils';
import { setLocalStorage } from '../utils/wdio-commands';

/**
 * yarn wdio run wdio.conf.ts --spec src/specs/video-player.e2e.ts
 */
describe('Video Player', () => {
  it('should play videos using local override', async () => {
    // 1. Load app and set override
    await browser.loadPicsaConfig('farmer_zm');

    // 3. Navigate to a page with video
    await browser.appNavigateTo('farmer/intro');

    await setupMockVideo();

    const downloadButtons = await $$('.download-button-inner');
    await expect(downloadButtons).toBeElementsArrayOfSize({
      gte: 1,
    });
    await downloadButtons[0].click();

    const playButton = await $('.play-button');
    await expect(playButton).toExist({ wait: 10 * 1000 });

    // Capture current package to verify context switch
    const appPackage = await browser.getCurrentPackage();

    await playButton.click();

    // Wait for the external video player to launch (package/activity change)
    await browser.waitUntil(
      async () => {
        const currentPackage = await browser.getCurrentPackage();
        return currentPackage !== appPackage;
      },
      {
        timeout: 10000,
        timeoutMsg: 'Expected external Android native video player to launch',
      },
    );

    // Go back to the app to confirm we can return
    await browser.back();
    await expect(playButton).toExist();

    // 4. Verify playback (screenshot might capturing the player if we didn't go back, but here we capture state after return)
    // taking a screenshot of the play button page
    await takeScreenshot('video-return-to-app');
  });
});

async function setupMockVideo() {
  // 2. Read dummy video as base64
  const localVideoPath = join(__dirname, '../fixtures/dummy-video.mp4');
  const videoBase64 = fs.readFileSync(localVideoPath, { encoding: 'base64' });

  // Set local storage to mock the video download
  await setLocalStorage({
    E2E_HTTP_MOCKS: JSON.stringify({
      matches: [
        {
          // Match any mp4 request or specific url
          // Adjust regex as needed to match the production URL the app uses
          urlRegex: '\\.mp4',
          method: 'GET',
          response: {
            bodyBase64: videoBase64,
            status: 200,
            headers: {
              'Content-Type': 'video/mp4',
              'Content-Length': String(fs.statSync(localVideoPath).size),
            },
          },
        },
      ],
    }),
  });
}
