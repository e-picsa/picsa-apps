import { CommonModule } from '@angular/common';
import { inject, Injectable, ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { DataIconRegistry, IconPackName } from '@picsa/data/iconRegistry';
import { PicsaTranslateModule } from '@picsa/i18n';

import { PICSA_FORM_COMPONENTS } from './components';
import { PICSA_FORM_DIRECTIVES } from './directives';

@Injectable({
  providedIn: 'root',
})
export class PicsaFormsModuleConfig {
  public iconPacks: IconPackName[] = ['crop_activity', 'crops', 'weather'];
}

/**
 * Single module import (large size) that includes all components and directives
 *
 * NOTE - all components and directives can also be imported standalone instead
 **/
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    PicsaTranslateModule,
    ...PICSA_FORM_COMPONENTS,
    ...PICSA_FORM_DIRECTIVES,
  ],
  exports: [...PICSA_FORM_COMPONENTS, ...PICSA_FORM_DIRECTIVES],
})
export class PicsaFormsModule {
  private config = inject<PicsaFormsModuleConfig>(PicsaFormsModuleConfig);

  constructor() {
    const dataIconRegistry = inject(DataIconRegistry);
    const config = this.config;

    for (const iconPack of config.iconPacks) {
      dataIconRegistry.registerMatIcons(iconPack);
    }
  }

  /** Use forRoot so that constructor function will be called once when module registered */
  static forRoot(
    config: PicsaFormsModuleConfig = { iconPacks: ['crops', 'crop_activity', 'weather'] },
  ): ModuleWithProviders<PicsaFormsModule> {
    return {
      ngModule: PicsaFormsModule,
      providers: [{ provide: PicsaFormsModuleConfig, useValue: config }],
    };
  }
}
