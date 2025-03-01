import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import { PDFScriptLoaderService } from 'ngx-extended-pdf-viewer';

import { PicsaAsyncService } from '../../services/asyncService.service';
import { ErrorHandlerService } from '../../services/core/error-handler.service';

@Injectable({ providedIn: 'root' })
export class PicsaPDFViewerService extends PicsaAsyncService {
  public isCompatible = false;

  constructor(private injector: Injector, private errorService: ErrorHandlerService) {
    super();
  }

  public override async init() {
    await this.runCompatibilityCheck();
  }

  private async runCompatibilityCheck() {
    // Use same check that ngx-extended-pdf calls when checking compatibility locally
    // As es5 bundles not included will fallback to update prompt in UI if compatibility fails

    // NOTE - as of v19 requires quite modern features available in native browser (pdfJS v4.1+),
    // and cannot be polyfilled as required by worker/iframe. E.g. Promise.withResolvers
    // https://github.com/stephanrauh/ngx-extended-pdf-viewer/issues/2500
    // https://github.com/mozilla/pdf.js/pull/17854
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers#browser_compatibility

    // This is currently known to be resolved as of chrome 119

    // Use inline scripts. Note if Using CSP security should set to false and include
    // `op-chaining-support.js` in list of assets copied to run compatibility checks from js file instead of inline
    const useInlineScripts = true;
    try {
      // As ngx-extended viewer uses effect signal for it's own service use injection context to ensure availability
      runInInjectionContext(this.injector, async () => {
        const needsES5 = await new PDFScriptLoaderService(null as any, null as any)['needsES5'](useInlineScripts);
        this.isCompatible = !needsES5;
      });
    } catch (error) {
      this.isCompatible = false;
      this.errorService.handleError(error as any);
    }
  }
}
