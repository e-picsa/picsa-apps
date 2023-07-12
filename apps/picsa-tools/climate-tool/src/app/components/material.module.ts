import { NgModule } from '@angular/core';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatIconRegistry } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { DomSanitizer } from '@angular/platform-browser';

// also other deps from: https://material.angular.io/guide/getting-started
// https://github.com/angular/components/issues/4278 and also load in app.module.ts

const modules = [
  MatBottomSheetModule,
  MatButtonModule,
  MatButtonToggleModule,
  MatCardModule,
  MatDatepickerModule,
  MatDialogModule,
  MatDividerModule,
  MatIconModule,
  MatInputModule,
  MatMenuModule,
  MatNativeDateModule,
  MatSidenavModule,
];

@NgModule({
  imports: modules,
  exports: modules,
})
export class PicsaClimateMaterialModule {
  constructor(private matIconRegistry: MatIconRegistry, private domSanitizer: DomSanitizer) {
    this.registerIcons();
  }

  registerIcons() {
    const CLIMATE_ICONS = {
      station: 'station',
      chart: 'chart',
      download: 'download',
      controls: 'controls',
    };
    for (const [key, value] of Object.entries(CLIMATE_ICONS)) {
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
