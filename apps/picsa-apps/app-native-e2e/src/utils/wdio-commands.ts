import { TIMEOUTS } from '../constants';

/**
 * Switches the driver context to the WebView.
 */
export async function switchToWebView() {
  // Wait for the webview context to be available
  await browser.waitUntil(
    async () => {
      const contexts = await browser.getContexts();
      return contexts.length > 1;
    },
    { timeout: TIMEOUTS.WEBVIEW_WAIT, timeoutMsg: 'Webview context was not found. App might not have loaded.' },
  );

  const contexts = await browser.getContexts();
  const webviewContext = contexts.find((c) => typeof c === 'string' && c.toUpperCase().includes('WEBVIEW'));

  if (webviewContext) {
    await browser.switchContext(webviewContext as string);
  } else {
    throw new Error('Could not find WebView context');
  }
}

/**
 * Set localstorage key-value pairs
 */
export async function setLocalStorage(data: Record<string, unknown>, shouldReload = true) {
  // Ensure we are in webview
  await browser.switchToWebView();

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
  console.log('navigating to', path);
  // Ensure we are in webview
  await browser.switchToWebView();

  // Use JS to navigate, letting the webview handle the relative path and base url resolution
  await browser.execute((targetUrl: string) => {
    window.location.assign(`/${targetUrl}`);
  }, path);
}
