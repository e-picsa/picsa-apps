import { Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'climate-tool',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'climate-tool';
  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {
    this.registerIcons();
  }
  registerIcons() {
    const icons = {
      station: 'station',
      chart: 'chart'
    };
    for (const [key, value] of Object.entries(icons)) {
      this.matIconRegistry.addSvgIcon(
        `picsa_${key}`,
        this.domSanitizer.bypassSecurityTrustResourceUrl(
          `assets/icons/${value}.svg`
        )
      );
    }
  }
}
