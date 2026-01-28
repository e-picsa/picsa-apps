import { takeScreenshot } from '../utils/driver-utils';
import { skipOnModernDevices } from '../utils/version-utils';

/**
 * yarn wdio run wdio.conf.ts --spec src/specs/compatibility.e2e.ts
 */
describe('Compatibility Check', () => {
  before(async function () {
    // Ensure we are in the webview context
    skipOnModernDevices(this);
  });

  it('should display the update prompt on restricted devices', async () => {
    // The prompt is added to the body with id 'updatePrompt'
    const prompt = await $('#updatePrompt');
    await prompt.waitForExist({ timeout: 5000 });

    await takeScreenshot('CompatibilityCheck');
  });
});
