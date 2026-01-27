import type { Context } from '@wdio/protocols';

import { TIMEOUTS } from '../constants';

/**
 * Switches the driver context to the WebView.
 * NOTE - this is automatically called during before hook
 */
export async function switchToWebView() {
  const current = await driver.getContext();
  const contextId = getContextId(current);
  if (contextId.includes('WEBVIEW')) return;

  await driver.waitUntil(async () => {
    const contexts = await driver.getContexts();
    return contexts.some((c) => getContextId(c).includes('WEBVIEW'));
  });

  const contexts = await driver.getContexts();
  const webview = contexts.find((c) => getContextId(c).toUpperCase().includes('WEBVIEW'));
  await driver.switchContext(getContextId(webview));
}

function getContextId(context: Context): string {
  return typeof context === 'string' ? context : context.id;
}

/**
 * Set localstorage key-value pairs
 */
export async function setLocalStorage(data: Record<string, unknown>, shouldReload = true) {
  await browser.execute((state: Record<string, unknown>) => {
    Object.keys(state).forEach((key) => {
      const value = state[key];
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      window.localStorage.setItem(key, stringValue);
    });
  }, data);

  if (shouldReload) {
    await browser.execute(() => window.location.reload());
    await browser.waitUntil(async () => await browser.execute(() => document.readyState === 'complete'), {
      timeout: TIMEOUTS.WEBVIEW_WAIT,
      timeoutMsg: 'Page did not reload in time',
    });
  }
}

/**
 * Navigates to a specific URL ensuring WebView context
 * @param url The URL to navigate to
 */
export async function appNavigateTo(path: string) {
  // Use JS to navigate, letting the webview handle the relative path and base url resolution
  await browser.execute((targetUrl: string) => {
    window.location.assign(`/${targetUrl}`);
  }, path);
}
