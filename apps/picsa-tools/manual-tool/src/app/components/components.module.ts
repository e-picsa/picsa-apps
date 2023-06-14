import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
// Shared modules
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { ManualToolMaterialModule } from './material.module';
// Local components
import { stepsContainerComponent } from './stepsContainer/stepsContainer.component';

const Components = [stepsContainerComponent];

@NgModule({
  imports: [
    CommonModule,
    ManualToolMaterialModule,
    PicsaCommonComponentsModule,
    PicsaTranslateModule,
    RouterModule,
  ],
  exports: [ManualToolMaterialModule, PicsaCommonComponentsModule, ...Components],
  declarations: [Components],
  providers: [],
})
export class ManualToolComponentsModule {}
