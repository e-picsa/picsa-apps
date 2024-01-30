import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DataIconRegistry } from '@picsa/data/iconRegistry';

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
  constructor(dataIconRegistry: DataIconRegistry) {
    // Register icons for use with form components
    dataIconRegistry.registerMatIcons('crop_activity');
    dataIconRegistry.registerMatIcons('weather');
  }

  /** Use forRoot so that constructor function will be called once when module registered */
  static forRoot(): ModuleWithProviders<PicsaFormsModule> {
    return {
      ngModule: PicsaFormsModule,
    };
  }
}
