import { NgModule } from '@angular/core';
import { ClimateChartComponent } from './climate-chart/climate-chart';
import { CombinedProbabilityComponent } from './combined-probability/combined-probability';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ViewSelectComponent } from './view-select/view-select';
import { PicsaTranslateModule } from '@picsa/modules/translate';
import { ClimateMaterialModule } from '../material.module';
import { ProbabilityToolComponent } from './probability-tool/probability-tool';
import { CropAnalysisComponent } from './crop-analysis/crop-analysis';
import { PicsaChartsModule, PicsaDialogsModule } from '@picsa/features';
import { ChartOptionsComponent } from './chart-options/chart-options';

@NgModule({
  declarations: [
    ClimateChartComponent,
    CombinedProbabilityComponent,
    ViewSelectComponent,
    ProbabilityToolComponent,
    CropAnalysisComponent,
    ChartOptionsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PicsaTranslateModule,
    ClimateMaterialModule,
    PicsaChartsModule,
    PicsaDialogsModule
  ],
  exports: [
    ClimateChartComponent,
    CombinedProbabilityComponent,
    ViewSelectComponent,
    ProbabilityToolComponent,
    CropAnalysisComponent
  ],
  entryComponents: [ChartOptionsComponent]
})
export class ClimateToolComponentsModule {}
