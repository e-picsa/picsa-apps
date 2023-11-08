import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { DomSanitizer } from '@angular/platform-browser';
import { CROPS_DATA } from '@picsa/data';

const MODULES = [
  MatButtonModule,
  MatInputModule,
  MatTableModule,
  MatFormFieldModule,
  MatIconModule,
  MatCardModule,
  MatOptionModule,
  MatSelectModule,
];

// use custom module to make it easier to control what is available through app
@NgModule({
  imports: MODULES,
  exports: MODULES,
})
export class CropProbabilityMaterialModule {
  constructor(private matIconRegistry: MatIconRegistry, private domSanitizer: DomSanitizer) {
    this.registerIcons();
  }

  registerIcons() {
    for (const { icon, name } of Object.values(CROPS_DATA)) {
      const iconUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(icon);
      this.matIconRegistry.addSvgIcon(`picsa_crop_${name}`, iconUrl);
    }
  }
}
