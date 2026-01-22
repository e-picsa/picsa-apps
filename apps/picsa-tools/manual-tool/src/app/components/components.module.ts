import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaTranslateModule } from '@picsa/i18n';
// Local components
import { PdfViewerComponent } from '@picsa/shared/features';

import { ManualSelectComponent } from './manualSelect/manual-select.component';
import { ManualToolMaterialModule } from './material.module';
import { stepsContainerComponent } from './stepsContainer/stepsContainer.component';

const Components = [stepsContainerComponent];
const STANDALONE_COMPONENTS = [ManualSelectComponent];

@NgModule({
  imports: [
    CommonModule,
    ManualToolMaterialModule,
    PicsaCommonComponentsModule,
    PicsaTranslateModule,
    PdfViewerComponent,
    RouterModule,
    ...STANDALONE_COMPONENTS,
  ],
  exports: [
    ManualToolMaterialModule,
    PicsaCommonComponentsModule,
    PdfViewerComponent,
    ...Components,
    ...STANDALONE_COMPONENTS,
  ],
  declarations: Components,
  providers: [],
})
export class ManualToolComponentsModule {}
