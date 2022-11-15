import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaChartsModule, PicsaDialogsModule } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';

import { PicsaClimateMaterialModule } from './material.module';

import { ClimateChartLayoutComponent } from './chart-layout/chart-layout';
import { ClimateChartOptionsComponent } from './climate-chart-options/climate-chart-options.component';
import { CombinedProbabilityComponent } from './combined-probability/combined-probability';
import { CropAnalysisComponent } from './crop-analysis/crop-analysis';
import { LineToolComponent } from './line-tool/line-tool.component';
import { ProbabilityToolComponent } from './probability-tool/probability-tool';
import { ViewSelectComponent } from './view-select/view-select';

const Components = [
  ClimateChartLayoutComponent,
  ClimateChartOptionsComponent,
  CombinedProbabilityComponent,
  CropAnalysisComponent,
  LineToolComponent,
  ProbabilityToolComponent,
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
