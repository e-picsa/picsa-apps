import fs from 'fs';
import path from 'path';

import { PATHS, TIMEOUTS } from '../constants';

/**
 * Switches the driver context to the WebView.
 */
export async function switchToWebView(this: WebdriverIO.Browser) {
  // Wait for the webview context to be available
  await this.waitUntil(
    async () => {
      const contexts = await this.getContexts();
      return contexts.length > 1;
    },
    { timeout: TIMEOUTS.WEBVIEW_WAIT, timeoutMsg: 'Webview context was not found. App might not have loaded.' },
  );

  const contexts = await this.getContexts();
  const webviewContext = contexts.find((c) => typeof c === 'string' && c.toUpperCase().includes('WEBVIEW'));

  if (webviewContext) {
    await this.switchContext(webviewContext as string);
  } else {
    throw new Error('Could not find WebView context');
  }
}

/**
 * Loads localStorage state from a JSON fixture file.
 */
export async function loadState(this: WebdriverIO.Browser, fixturePath: string, shouldReload = true) {
  // Ensure we are in webview
  await this.switchToWebView();
  const filePath = path.resolve(PATHS.FIXTURES, fixturePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fixture file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch (e) {
    throw new Error(`Failed to parse fixture file ${filePath}: ${(e as Error).message}`);
  }

  await this.execute((state) => {
    Object.keys(state).forEach((key) => {
      const value = state[key];
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      window.localStorage.setItem(key, stringValue);
    });
  }, data);

  console.log(`[Storage] Loaded initial state from ${path.basename(filePath)}`);

  if (shouldReload) {
    await this.execute(() => window.location.reload());
    await this.pause(TIMEOUTS.RELOAD_WAIT);
  }
}
