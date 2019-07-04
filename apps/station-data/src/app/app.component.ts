import { Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  // tslint:disable component-selector
  selector: 'picsa-station-data',
  template: `
    <router-outlet></router-outlet>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'picsa-station-data';
  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {
    this.registerIcons();
  }

  registerIcons() {
    this.matIconRegistry.addSvgIcon(
      'station_data_summaries',
      this.domSanitizer.bypassSecurityTrustResourceUrl(
        'assets/images/icons/summaries.svg'
      )
    );
  }
}
