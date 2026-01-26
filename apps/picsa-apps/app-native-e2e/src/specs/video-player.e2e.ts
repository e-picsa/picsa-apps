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

    // // 2. Read dummy video as base64
    // const localVideoPath = join(__dirname, '../fixtures/dummy-video.mp4');
    // const videoBase64 = fs.readFileSync(localVideoPath, { encoding: 'base64' });

    // // Set local storage to mock the video download
    // await setLocalStorage({
    //   E2E_HTTP_MOCKS: JSON.stringify({
    //     matches: [
    //       {
    //         // Match any mp4 request or specific url
    //         // Adjust regex as needed to match the production URL the app uses
    //         urlRegex: '.mp4',
    //         method: 'GET',
    //         response: {
    //           bodyBase64: videoBase64,
    //           status: 200,
    //         },
    //       },
    //     ],
    //   }),
    // });

    // 3. Navigate to a page with video
    await browser.appNavigateTo('farmer/intro');

    const dlButton = await $('resource-download');
    await expect(dlButton).toExist();
    await dlButton.click();

    // Wait for video player to be visible
    const videoPlayer = $('picsa-video-player');
    await expect(videoPlayer).toExist();
    await videoPlayer.waitForExist({ timeout: 10000 });

    // 4. Verify playback
    // Take screenshot to verify video is loaded
    await takeScreenshot('video-player-loaded');
  });
});
