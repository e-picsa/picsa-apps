import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

import { ManualToolMaterialModule } from './material.module';
// Local components
import { PdfViewerComponent } from './pdf-viewer/pdf-viewer.component';
import { stepsContainerComponent } from './stepsContainer/stepsContainer.component';

const Components = [PdfViewerComponent, stepsContainerComponent];

@NgModule({
  imports: [
    CommonModule,
    ManualToolMaterialModule,
    NgxExtendedPdfViewerModule,
    PicsaCommonComponentsModule,
    PicsaTranslateModule,
    RouterModule,
  ],
  exports: [ManualToolMaterialModule, PicsaCommonComponentsModule, ...Components],
  declarations: Components,
  providers: [],
})
export class ManualToolComponentsModule {}
