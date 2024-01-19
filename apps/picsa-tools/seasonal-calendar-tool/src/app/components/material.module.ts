import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatIconRegistry } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { DomSanitizer } from '@angular/platform-browser';

const COMPONENTS = [
  MatButtonModule,
  MatCardModule,
  MatDialogModule,
  MatIconModule,
  MatMenuModule,
  MatSelectModule,
  MatStepperModule,
  MatTableModule,
];
// use custom module to make it easier to control what is available through app
@NgModule({
  imports: COMPONENTS,
  exports: COMPONENTS,
})
export class SeasonalCalendarMaterialModule {
  constructor(private matIconRegistry: MatIconRegistry, private domSanitizer: DomSanitizer) {
    this.registerIcons();
  }
  // register custom icons from the assets/svgs folder for access within the app
  // icons can be accessed in mat-icon as svgIcon='seasonal_calendar_${key}'
  registerIcons() {
    const icons = {};
    for (const [key, value] of Object.entries(icons)) {
      const iconName = `seasonal_calendar_${key}`;
      const iconUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(`assets/svgs/${value}.svg`);
      this.matIconRegistry.addSvgIcon(iconName, iconUrl);
    }
  }
}
