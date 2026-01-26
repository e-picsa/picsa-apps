import type { UserSettingName } from '../fixtures/initial-state';

declare global {
  namespace WebdriverIO {
    interface Browser {
      /**
       * Loads predetermined picsa configuration into localstorage
       * @param configName Named config fixture
       * @param shouldReload Whether to reload the page after setting (default: true)
       */
      loadPicsaConfig: (configName: UserSettingName, shouldReload?: boolean) => Promise<void>;

      /**
       * Switch to the WebView context of the hybrid app.
       */
      switchToWebView: () => Promise<void>;

      /**
       * Navigates to a specific URL ensuring WebView context
       * @param url The URL to navigate to
       */
      navigateTo: (url: string) => Promise<void>;
    }
  }
}

export {};
