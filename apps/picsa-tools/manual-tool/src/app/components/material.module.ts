import { inject,NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { DomSanitizer } from '@angular/platform-browser';

const MODULES = [MatButtonModule, MatInputModule, MatIconModule, MatTabsModule];

// use custom module to make it easier to control what is available through app
@NgModule({
  imports: MODULES,
  exports: MODULES,
})
export class ManualToolMaterialModule {
  private matIconRegistry = inject(MatIconRegistry);
  private domSanitizer = inject(DomSanitizer);

  constructor() {
    this.registerIcons();
  }

  registerIcons() {
    const CUSTOM_ICONS: Record<string, string> = {
      calendar: 'calendar',
      campus: 'campus',
      crop: 'crop',
      livestock: 'livestock',
      resource_allocation: 'resourceAllocation',
      temperature: 'temperature',
      place_holder: 'place_holder',
      info: 'info',
      create: 'create',
      quiz: 'quiz',
    };

    for (const [key, value] of Object.entries(CUSTOM_ICONS)) {
      const iconUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(`assets/svgs/${value}.svg`);
      this.matIconRegistry.addSvgIconInNamespace('manual_tool', key, iconUrl);
    }
  }
}
