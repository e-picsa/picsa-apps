import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatIconRegistry } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer } from '@angular/platform-browser';
import { BUDGET_ICONS } from '@picsa/budget/src/app/app.component';
import { CLIMATE_ICONS } from '@picsa/climate/src/app/app.component';

// use custom module to make it easier to control what is available through app
@NgModule({
  imports: [
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatGridListModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
  ],
  exports: [
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatGridListModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
  ],
})
export class ExtensionToolkitMaterialModule {
  constructor(private matIconRegistry: MatIconRegistry, private domSanitizer: DomSanitizer) {
    this.registerIcons();
  }
  registerIcons() {
    const icons = {
      // TODO - climate and budget icons should register in lazy-loaded material module

      ...CLIMATE_ICONS,
      ...BUDGET_ICONS,
      resources: 'resources',
      discussions: 'discussions',
      'data-collection': 'data-collection',
      'budget-tool': 'budget-tool',
      'climate-tool': 'climate-tool',
      'option-tool': 'option-tool',
      'probability-tool': 'probability-tool',
      whatsapp: 'whatsapp',
      play_store: 'play_store',
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
