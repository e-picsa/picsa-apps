import { Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { CLIMATE_ICONS } from '@picsa/climate/src/app/app.component';
import { BUDGET_ICONS } from '@picsa/budget/src/app/app.component';

@Component({
  selector: 'picsa-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'extension-toolkit';

  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {
    this.registerIcons();
  }

  // Note, any icons registered in child modules will also need to be registered here
  // TODO - see if there is a better system for this
  registerIcons() {
    const icons = {
      ...CLIMATE_ICONS,
      ...BUDGET_ICONS,
      resources: 'resources',
      discussions: 'discussions',
      'data-collection': 'data-collection',
      'budget-tool': 'budget-tool',
      'climate-tool': 'climate-tool',
      whatsapp: 'whatsapp'
    };
    for (const [key, value] of Object.entries(icons)) {
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
