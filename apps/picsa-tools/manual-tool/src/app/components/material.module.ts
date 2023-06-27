import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { DomSanitizer } from '@angular/platform-browser';

const MODULES = [MatButtonModule, MatInputModule, MatIconModule];

// use custom module to make it easier to control what is available through app
@NgModule({
  imports: MODULES,
  exports: MODULES,
})
export class ManualToolMaterialModule {
  constructor(private matIconRegistry: MatIconRegistry, private domSanitizer: DomSanitizer) {
    this.registerIcons();
  }

  registerIcons() {
    const CUSTOM_ICONS: Record<string, string> = {
      calender: 'calender',
      campus: 'campus',
      crop: 'crop',
      livestock: 'livestock',
      resource_allocation: 'resourceAllocation',
      temperature: 'temperature',
      place_holder: 'place_holder',
      infor: 'infor',
      create: 'create',
      quiz: 'quiz',
    };

    for (const [key, value] of Object.entries(CUSTOM_ICONS)) {
      const iconName = `picsa_manual_${key}`;
      const iconUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(`assets/svgs/${value}.svg`);
      this.matIconRegistry.addSvgIcon(iconName, iconUrl);
    }
  }
}
