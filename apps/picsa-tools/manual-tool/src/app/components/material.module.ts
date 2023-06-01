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
    const CUSTOM_ICONS: Record<string, string> = {};

    for (const [key, value] of Object.entries(CUSTOM_ICONS)) {
      const iconUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(value);
      this.matIconRegistry.addSvgIcon(key, iconUrl);
    }
  }
}
