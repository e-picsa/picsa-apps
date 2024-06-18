import { CommonModule } from '@angular/common';
import { Component, Input, ViewEncapsulation } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { pdfDefaultOptions } from 'ngx-extended-pdf-viewer';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

@Component({
  selector: 'picsa-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [NgxExtendedPdfViewerModule, CommonModule],
})
export class PdfViewerComponent {
  legacyBrowser = true;
  sidebarOpen = false;
  public isNative = Capacitor.isNativePlatform();
  @Input() page?: number;
  @Input() src: string;
  constructor() {
    // name of folder pdf viewer assets copied to as declared in `angular.json`
    pdfDefaultOptions.assetsFolder = 'assets/pdf-viewer';
    // additional locales are currently excluded from main build
    pdfDefaultOptions.locale = 'en-GB';
    this.legacyBrowser = isLegacyBrowser();
  }
}

/**
 * Check whether browser supports post-ES5 features. Further checks could be made, for example
 * whether the browser is IE/iOS, but not necessary at runtime as these platforms aren't supported anyway.
 * See discussion thread here: https://github.com/IDEMSInternational/parenting-app-ui/issues/1726
 */
function isLegacyBrowser() {
  if (typeof window === 'undefined') {
    // server-side rendering
    return false;
  }
  return (
    typeof ReadableStream === 'undefined' || typeof Promise['allSettled'] === 'undefined' || !supportsOptionalChaining()
  );
}

function supportsOptionalChaining() {
  try {
    eval('const foo = {}; foo?.bar');
  } catch (e) {
    return false;
  }
  return true;
}
