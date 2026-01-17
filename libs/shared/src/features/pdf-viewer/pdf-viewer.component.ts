import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject,Input, signal, ViewEncapsulation } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { pdfDefaultOptions } from 'ngx-extended-pdf-viewer';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

import { PicsaTranslateModule } from '../../modules';
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
  // additional locales are currently excluded from main build
  locale = 'en-GB';
  public isNative = Capacitor.isNativePlatform();
  @Input() page?: number;
  @Input() src: string;

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
