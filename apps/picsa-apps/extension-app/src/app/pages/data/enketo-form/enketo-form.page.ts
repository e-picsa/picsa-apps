import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject } from '@angular/core';

@Component({
  selector: 'enketo-form',
  templateUrl: './enketo-form.page.html',
  styleUrls: [],
})
export class EnketoFormPage implements AfterViewInit {
  constructor(
    @Inject(DOCUMENT) private document: Document,
    private elementRef: ElementRef
  ) {}

  ngAfterViewInit() {
    this.setEnv();
    var s = this.document.createElement('script');
    s.type = 'text/javascript';
    s.src = '/assets/enketo/enketo-webform.js';
    this.elementRef.nativeElement.appendChild(s);
  }

  private setEnv() {
    (window as any).env = {
      googleApiKey: '',
      maps: [
        {
          attribution:
            '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> & <a href="https://www.hotosm.org/updates/2013-09-29_a_new_window_on_openstreetmap_data">Yohan Boniface & Humanitarian OpenStreetMap Team</a> | <a href="https://www.openstreetmap.org/copyright">Terms</a>',
          name: 'humanitarian',
          tiles: ['https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'],
        },
        {
          attribution:
            'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          name: 'satellite',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
        },
        {
          attribution:
            '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> | <a href="https://www.openstreetmap.org/copyright">Terms</a>',
          name: 'terrain',
          tiles: ['https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'],
        },
        {
          attribution:
            '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> | <a href="https://www.openstreetmap.org/copyright">Terms</a>',
          name: 'streets',
          tiles: ['https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'],
        },
      ],

      modernBrowsersURL: 'modern-browsers',
      supportEmail: 'support@kobotoolbox.org',
      themesSupported: ['formhub', 'grid', 'kobo', 'plain'],
      defaultTheme: 'kobo',
      languagesSupported: [
        'ar',
        'cs',
        'de',
        'el',
        'en',
        'es',
        'fa',
        'fi',
        'fr',
        'hi',
        'it',
        'ka',
        'lo',
        'nl',
        'no',
        'pl',
        'pt',
        'ro',
        'ru',
        'sk',
        'sq',
        'sv',
        'sw',
        'tr',
        'vi',
        'zh',
      ],
      timeout: 300000,
      submissionParameter: { name: '' },
      basePath: '/assets/enketo',
      repeatOrdinals: false,
      validateContinuously: false,
      validatePage: true,
      textMaxChars: 1000000,
      csrfCookieName: '__csrf',
      excludeNonRelevant: false,
      experimentalOptimizations: { computeAsync: false },
    };
  }
}

/**
 
<script
      id="main-script"
      defer
      module
      src="/assets/enketo/js/build/enketo-webform.js"
    ></script>
    <script>
      
    </script>

 */
