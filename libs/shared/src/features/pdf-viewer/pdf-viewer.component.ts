import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, Input, signal, ViewEncapsulation } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { PicsaTranslateModule } from '@picsa/i18n';
import { pdfDefaultOptions } from 'ngx-extended-pdf-viewer';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

import { PicsaPDFViewerService } from './pdf-viewer.service';

@Component({
  selector: 'picsa-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [NgxExtendedPdfViewerModule, MatButtonModule, CommonModule, PicsaTranslateModule],
})
export class PdfViewerComponent implements AfterViewInit {
  service = inject(PicsaPDFViewerService);

  sidebarOpen = false;

  /**
   * PDF.js localization (`GenericL10n`) hardcodes "en-us" as the root fallback language in
   * `DOMLocalization` generator: `langs = [requestedLang, baseLang, 'en-us']`.
   *
   * When `locale = 'en-GB'` was used, PDF.js fetched `en-GB/viewer.ftl` and then immediately
   * attempted to fetch fallback `en-US/viewer.ftl`. Because only `locale/en-GB/*` was bundled in
   * `project.json`, the secondary fetch 404'd. On Capacitor Android WebView (`http://localhost/...`),
   * 404 responses have `ok: false` and `statusText: "OK"`, throwing an unhandled `Error: OK`.
   *
   * Why `en-US` is selected:
   * - Matching `requestedLang` to PDF.js's root fallback (`en-us`) reduces the lookup chain to
   *   `['en-us']`, executing only 1 HTTP fetch (`en-US/viewer.ftl`) with 0 404s.
   * - `en-US` and `en-GB` are 98% identical (~275 Fluent strings). The few spelling differences
   *   (e.g., Colour vs Color) belong to toolbar/editor buttons hidden by PICSA's custom toolbar.
   *
   * Alternatives considered:
   * 1. Bundle both `en-GB` and `en-US`: Increases bundle size (~42 KB) and makes 2 network requests per PDF view.
   * 2. Rely on PDF.js's inline `#yo` English bundle without any external locale files: Saves ~21 KB of assets,
   *    but causes a caught 404 request to `locale.json` during initialization.
   * 3. Option A (Selected): Use `locale = 'en-US'` and bundle only `locale/en-US/*`. Minimal bundle size,
   *    single HTTP fetch, and zero 404 errors.
   */
  locale = 'en-US';
  public isNative = Capacitor.isNativePlatform();
  @Input() page?: number;
  @Input() src: string | Blob | Uint8Array;

  public serviceReady = toSignal(this.service.ready$, { initialValue: false });
  public isCompatible = signal(false);

  constructor() {
    // name of folder pdf viewer assets copied to as declared in `angular.json`
    pdfDefaultOptions.assetsFolder = 'assets/pdf-viewer';
    // force viewer to not use es5 fallback (not included in build)
    // use comparable check below to share message if not available for legacy browser
  }

  async ngAfterViewInit() {
    await this.service.ready();
    this.isCompatible.set(this.service.isCompatible);
  }

  public restartApp() {
    App.exitApp();
  }
}
