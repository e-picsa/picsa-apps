import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PicsaCommonComponentsModule } from '@picsa/components';
// Local components
import { PdfViewerComponent } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

import { ManualToolMaterialModule } from './material.module';
import { stepsContainerComponent } from './stepsContainer/stepsContainer.component';

const Components = [stepsContainerComponent];

@NgModule({
  imports: [
    CommonModule,
    ManualToolMaterialModule,
    NgxExtendedPdfViewerModule,
    PicsaCommonComponentsModule,
    PicsaTranslateModule,
    PdfViewerComponent,
    RouterModule,
  ],
  exports: [ManualToolMaterialModule, PicsaCommonComponentsModule, PdfViewerComponent, ...Components],
  declarations: Components,
  providers: [],
})
export class ManualToolComponentsModule {}
