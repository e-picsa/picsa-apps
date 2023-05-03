import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { DomSanitizer } from '@angular/platform-browser';

const MODULES = [MatButtonModule, MatInputModule, MatTableModule, MatFormFieldModule, MatIconModule, MatCardModule];

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
    const CROP_PROBABILITY_ICONS = {
      beans: 'beans',
      cow_peas:'cow_peas',
      ground_nuts:'ground_nuts',
      maize:'maize',
      sorghum:'sorghum',
      soya_beans:'soya_beans',
      sun_flower:'sun_flower'
    };
    for (const [key, value] of Object.entries(CROP_PROBABILITY_ICONS)) {
      const iconName = `picsa_crop_${key}`;
      const iconUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(`assets/icons/mat-icons/${value}.svg`);
      this.matIconRegistry.addSvgIcon(iconName, iconUrl);
    }
  }
}
