import { $, browser, expect } from '@wdio/globals';
import * as fs from 'fs';
import { join } from 'path';

import { takeScreenshot } from '../utils/driver-utils';
import { setLocalStorage } from '../utils/wdio-commands';

/**
 * yarn wdio run wdio.conf.ts --spec src/specs/video-player.e2e.ts
 */
describe('Video Player', () => {
  before(async function () {
    await browser.switchToWebView();
  });
  it('should play videos using local override', async () => {
    await setupMockVideo();
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

async function setupMockVideo() {
  // 2. Read dummy video as base64
  const localVideoPath = join(__dirname, '../fixtures/dummy-video.mp4');
  const videoBase64 = fs.readFileSync(localVideoPath, { encoding: 'base64' });
  const httpMock = {
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
  };

  // Set local storage to mock the video download
  await setLocalStorage({ E2E_HTTP_MOCKS: JSON.stringify(httpMock) }, false);
}
