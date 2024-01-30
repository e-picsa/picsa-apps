import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatIconRegistry } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer } from '@angular/platform-browser';

const modules = [MatButtonModule, MatIconModule, MatCardModule, MatProgressBarModule, MatProgressSpinnerModule];

// use custom module to make it easier to control what is available through app
@NgModule({
  imports: modules,
  exports: modules,
})
export class ExtensionToolkitMaterialModule {
  constructor(private matIconRegistry: MatIconRegistry, private domSanitizer: DomSanitizer) {
    this.registerIcons();
  }
  registerIcons() {
    const icons = [
      // TODO - climate and budget icons should register in lazy-loaded material module
      'budget_tool',
      'climate_tool',
      'data_collection',
      'discussions',
      'manual_tool',
      'option_tool',
      'play_store',
      'probability_tool',
      'resources_tool',
      'seasonal_calendar_tool',
      'tutorial',
      'whatsapp',
      'farmer_activity',
    ];

    for (const icon of icons) {
      // NOTE - svgs are imported from shared lib (see angular.json for config)
      this.matIconRegistry.addSvgIconInNamespace(
        'extension_app',
        icon,
        this.domSanitizer.bypassSecurityTrustResourceUrl(`assets/svgs/${icon}.svg`)
      );
    }
  }
}
