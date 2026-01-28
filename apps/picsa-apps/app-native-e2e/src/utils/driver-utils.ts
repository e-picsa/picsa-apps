import type { Context } from '@wdio/protocols';
import { join } from 'path';

import { PATHS } from '../constants';

const getContextId = (context: Context): string => {
  return typeof context === 'string' ? context : context.id;
};

/**
 * Switches the driver context
 * NOTE - this is automatically called during before hook
 */
export async function switchToContext(context: 'WEBVIEW' | 'NATIVE_APP') {
  const current = await driver.getContext();
  const contextId = getContextId(current);
  if (contextId.includes(context)) return;

  await driver.waitUntil(async () => {
    const contexts = await driver.getContexts();
    return contexts.some((c) => getContextId(c).includes(context));
  });

  const contexts = await driver.getContexts();
  const targetContext = contexts.find((c) => getContextId(c).toUpperCase().includes(context));
  await driver.switchContext(getContextId(targetContext));
}

/**
 * Takes a screenshot safely by temporarily switching to NATIVE_APP context if in WEBVIEW.
 * This avoids timeouts on older Android versions/WebViews and ensures consistent capture of native elements.
 */
export const takeScreenshot = async (nameOrPath: string) => {
  const isPath = nameOrPath.endsWith('.png');
  const filePath = isPath ? nameOrPath : join(PATHS.SCREENSHOTS, `${nameOrPath}.png`);

  await switchToContext('NATIVE_APP');
  await driver.saveScreenshot(filePath);
  await switchToContext('WEBVIEW');
};
