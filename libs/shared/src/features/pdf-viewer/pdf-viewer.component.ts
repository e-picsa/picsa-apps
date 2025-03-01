import { CommonModule } from '@angular/common';
import { Component, Input, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { pdfDefaultOptions, PDFScriptLoaderService } from 'ngx-extended-pdf-viewer';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

@Component({
  selector: 'picsa-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [NgxExtendedPdfViewerModule, MatButtonModule, CommonModule],
})
export class PdfViewerComponent {
  legacyBrowser = true;
  sidebarOpen = false;
  // additional locales are currently excluded from main build
  locale = 'en-GB';
  public isNative = Capacitor.isNativePlatform();
  @Input() page?: number;
  @Input() src: string;
  constructor() {
    // name of folder pdf viewer assets copied to as declared in `angular.json`
    pdfDefaultOptions.assetsFolder = 'assets/pdf-viewer';
    // force viewer to not use es5 fallback (not included in build)
    // use comparable check below to share message if not available for legacy browser
    this.runCompatibilityCheck();
  }

  public restartApp() {
    App.exitApp();
  }

  private async runCompatibilityCheck() {
    // use same check that ngx-extended-pdf calls when checking compatibility locally

    // NOTE - as of v19 requires quite modern features available in native browser (pdfJS v4.1+),
    // and cannot be polyfilled as required by worker/iframe. E.g. Promise.withResolvers
    // https://github.com/stephanrauh/ngx-extended-pdf-viewer/issues/2500
    // https://github.com/mozilla/pdf.js/pull/17854
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers#browser_compatibility

    // This is currently known to be resolved as of chrome 119

    // Use inline scripts. Note if Using CSP security should set to false and include
    // `op-chaining-support.js` in list of assets copied to run compatibility checks from js file instead of inline
    const useInlineScripts = true;
    this.legacyBrowser = await new PDFScriptLoaderService(null as any, null as any)['needsES5'](useInlineScripts);
  }
}
