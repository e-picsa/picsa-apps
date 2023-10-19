import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatIconRegistry } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { DomSanitizer } from '@angular/platform-browser';

const COMPONENTS = [MatIconModule, MatTabsModule];
// use custom module to make it easier to control what is available through app
@NgModule({
  imports: COMPONENTS,
  exports: COMPONENTS,
})
export class FarmerActivityMaterialModule {
  constructor(private matIconRegistry: MatIconRegistry, private domSanitizer: DomSanitizer) {
    this.registerIcons();
  }
  // register custom icons from the assets/svgs folder for access within the app
  // icons can be accessed in mat-icon as svgIcon='farmer_activity_${key}'
  registerIcons() {
    const icons = {};
    for (const [key, value] of Object.entries(icons)) {
      const iconName = `farmer_activity_${key}`;
      const iconUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(`assets/svgs/${value}.svg`);
      this.matIconRegistry.addSvgIcon(iconName, iconUrl);
    }
  }
}
