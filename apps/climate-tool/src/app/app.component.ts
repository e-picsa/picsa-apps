import { Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { PicsaTranslateService } from '@picsa/modules/translate';

@Component({
  selector: 'climate-tool',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'climate-tool';
  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    public translate: PicsaTranslateService
  ) {
    this.registerIcons();
  }
  registerIcons() {
    for (const [key, value] of Object.entries(CLIMATE_ICONS)) {
      this.matIconRegistry.addSvgIcon(
        `picsa_${key}`,
        this.domSanitizer.bypassSecurityTrustResourceUrl(
          // NOTE - svgs are imported from shared lib (see angular.json for config)
          `assets/images/${value}.svg`
        )
      );
    }
  }
}

@Component({
  selector: 'climate-tool',
  // use empty template as router outlet not required
  template: '',
  styleUrls: ['./app.component.scss']
})
export class AppComponentEmbedded extends AppComponent {}

export const CLIMATE_ICONS = {
  station: 'station',
  chart: 'chart',
  download: 'download',
  controls: 'controls'
};
