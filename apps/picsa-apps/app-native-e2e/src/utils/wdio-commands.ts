import { TIMEOUTS } from '../constants';

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
  // Give UI time to settle after navigation
  await browser.pause(2000);
}
