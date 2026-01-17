import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatIconRegistry } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { DomSanitizer } from '@angular/platform-browser';
import { DataIconRegistry } from '@picsa/data/iconRegistry';

const COMPONENTS = [MatButtonModule, MatDialogModule, MatIconModule, MatSelectModule, MatStepperModule, MatTableModule];
// use custom module to make it easier to control what is available through app
@NgModule({
  imports: COMPONENTS,
  exports: COMPONENTS,
})
export class OptionMaterialModule {
  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    dataIconRegistry: DataIconRegistry,
  ) {
    this.registerIcons();
    // register additional icons provided from shared data lib
    dataIconRegistry.registerMatIcons('weather');
  }
  // register custom icons from the assets/svgs folder for access within the app
  // icons can be accessed in mat-icon as svgIcon='options_tool:close'
  registerIcons() {
    const icons = ['close', 'female', 'male', 'risks'];
    for (const icon of icons) {
      const url = this.domSanitizer.bypassSecurityTrustResourceUrl(`assets/svgs/${icon}.svg`);
      this.matIconRegistry.addSvgIconInNamespace('options_tool', icon, url);
    }
  }
}
