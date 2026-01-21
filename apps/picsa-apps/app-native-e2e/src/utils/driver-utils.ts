import { join } from 'path';

import { PATHS } from '../constants';

export const takeScreenshot = async (name: string) => {
  await driver.saveScreenshot(join(PATHS.SCREENSHOTS, `${name}.png`));
};
