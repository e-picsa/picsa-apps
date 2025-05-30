import { CommonModule } from '@angular/common';
import { Inject, Injectable, ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { DataIconRegistry, IconPackName } from '@picsa/data/iconRegistry';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { PICSA_FORM_COMPONENTS } from './components';

@Injectable({
  providedIn: 'root',
})
export class PicsaFormsModuleConfig {
  public iconPacks: IconPackName[] = ['crop_activity', 'crops', 'weather'];
}

/** Input components for use within forms */
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
  ],
  exports: [...PICSA_FORM_COMPONENTS],
  declarations: [...PICSA_FORM_COMPONENTS],
})
export class PicsaFormsModule {
  constructor(
    dataIconRegistry: DataIconRegistry,
    @Inject(PicsaFormsModuleConfig) private config: PicsaFormsModuleConfig,
  ) {
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
