declare global {
  namespace WebdriverIO {
    interface Browser {
      /**
       * Loads localStorage state from a JSON fixture file.
       * @param fixturePath Path to the json file relative to fixtures directory
       * @param shouldReload Whether to reload the page after setting (default: true)
       */
      loadState: (fixturePath: string, shouldReload?: boolean) => Promise<void>;

      /**
       * Switch to the WebView context of the hybrid app.
       */
      switchToWebView: () => Promise<void>;
    }
  }
}

export {};
