import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatIconRegistry } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { DomSanitizer } from '@angular/platform-browser';

const COMPONENTS = [MatButtonModule, MatDialogModule, MatIconModule, MatSelectModule, MatStepperModule, MatTableModule];
// use custom module to make it easier to control what is available through app
@NgModule({
  imports: COMPONENTS,
  exports: COMPONENTS,
})
export class OptionMaterialModule {
  constructor(private matIconRegistry: MatIconRegistry, private domSanitizer: DomSanitizer) {
    this.registerIcons();
  }
  // register custom icons from the assets/svgs folder for access within the app
  // icons can be accessed in mat-icon as svgIcon='station_data_${key}'
  registerIcons() {
    const icons = {
      close: 'close',
      female: 'female',
      male: 'male',
      // NOTE - weather icons are copied from shared-assets via project.json
      rain_high: 'weather/rain_high',
      rain_low: 'weather/rain_low',
      rain_medium: 'weather/rain_medium',
      rain_high_label: 'weather/rain_high_label',
      rain_low_label: 'weather/rain_low_label',
      rain_medium_label: 'weather/rain_medium_label',
      risks: 'risks',
    };
    for (const [key, value] of Object.entries(icons)) {
      const iconName = `picsa_options_${key}`;
      const iconUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(`assets/svgs/${value}.svg`);
      this.matIconRegistry.addSvgIcon(iconName, iconUrl);
    }
  }
}
