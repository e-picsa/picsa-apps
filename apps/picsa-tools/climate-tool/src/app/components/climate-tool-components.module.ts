import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaChartsModule, PicsaDialogsModule } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';

import { PicsaClimateMaterialModule } from './material.module';

import { CombinedProbabilityComponent } from './chart-tools/combined-probability/combined-probability';
import { CropAnalysisComponent } from './chart-tools/crop-analysis/crop-analysis';
import { LineDatePickerHeaderComponent } from './chart-tools/line-tool/line-date-picker-header';
import { LineToolComponent } from './chart-tools/line-tool/line-tool.component';
import { ProbabilityToolComponent } from './chart-tools/probability-tool/probability-tool';
import { TercilesToolComponent } from './chart-tools/terciles-tool/terciles-tool.component';

import { ClimateChartLayoutComponent } from './chart-layout/chart-layout';
import { ClimateChartOptionsComponent } from './climate-chart-options/climate-chart-options.component';
import { ClimateShareDialogComponent } from './share-dialog/share-dialog.component';
import { ViewSelectComponent } from './view-select/view-select';
import { ClimatePrintLayoutComponent } from './print-layout/print-layout.component';

const Components = [
  ClimateChartLayoutComponent,
  ClimateChartOptionsComponent,
  ClimatePrintLayoutComponent,
  ClimateShareDialogComponent,
  CombinedProbabilityComponent,
  CropAnalysisComponent,
  LineToolComponent,
  LineDatePickerHeaderComponent,
  ProbabilityToolComponent,
  TercilesToolComponent,
  ViewSelectComponent,
];

@NgModule({
  declarations: Components,
  imports: [
    PicsaClimateMaterialModule,
    CommonModule,
    FormsModule,
    PicsaTranslateModule,
    PicsaCommonComponentsModule,
    PicsaChartsModule,
    PicsaDialogsModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  exports: [
    ...Components,
    PicsaCommonComponentsModule,
    PicsaClimateMaterialModule,
  ],
})
export class ClimateToolComponentsModule {}
