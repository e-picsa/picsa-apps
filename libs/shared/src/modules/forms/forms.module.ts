import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { CROPS_DATA, WEATHER_DATA } from '@picsa/data';

import { PicsaTranslateModule } from '../translate';
import { PICSA_FORM_COMPONENTS } from './components';

/** Input components for use within forms */
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    PicsaTranslateModule,
  ],
  exports: PICSA_FORM_COMPONENTS,
  declarations: PICSA_FORM_COMPONENTS,
})
export class PicsaFormsModule {
  constructor(private domSanitizer: DomSanitizer, private matIconRegistry: MatIconRegistry) {
    this.registerIcons();
  }

  /** Use forRoot so that constructor function will be called once when module registered */
  static forRoot(): ModuleWithProviders<PicsaFormsModule> {
    return {
      ngModule: PicsaFormsModule,
    };
  }

  /** Ensure mat-icons registered for use in crop-select component */
  private registerIcons() {
    for (const { icon, name } of Object.values(CROPS_DATA)) {
      const iconUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(icon);
      this.matIconRegistry.addSvgIcon(`picsa_crop_${name}`, iconUrl);
    }
    for (const { assetIcon, svgIcon } of Object.values(WEATHER_DATA)) {
      const iconUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(assetIcon);
      this.matIconRegistry.addSvgIcon(svgIcon, iconUrl);
    }
    // Perform check for single icon to ensure assets have been imported
    this.checkIconExists(`picsa_crops_${CROPS_DATA[0].name}`);
  }

  /**
   * Check whether a registered icon can be retrieved
   * Prompting error to import missing assets from shared-assets if missing
   **/
  private checkIconExists(iconName: string) {
    this.matIconRegistry.getNamedSvgIcon(iconName).subscribe({
      error: (err) => {
        if (err.status === 404) {
          const exampleImport = `\n\n{"glob": "**/*", "input": "libs/shared-assets/","output": "assets"}\n\n`;
          throw new Error(
            'Crop icons not registered for forms module, ensure "shared-assets" imported into app' + exampleImport
          );
        }
      },
    });
  }
}
