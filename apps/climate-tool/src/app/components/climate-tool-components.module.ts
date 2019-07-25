import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ClimateChartComponent } from './climate-chart/climate-chart';
import { CombinedProbabilityComponent } from './combined-probability/combined-probability';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ViewSelectComponent } from './view-select/view-select';
import { PicsaTranslateModule } from '@picsa/modules';
import { ClimateMaterialModule } from '../material.module';
import { ProbabilityToolComponent } from './probability-tool/probability-tool';
import { CropAnalysisComponent } from './crop-analysis/crop-analysis';
import { PicsaChartsModule } from '@picsa/features';

@NgModule({
  declarations: [
    ClimateChartComponent,
    CombinedProbabilityComponent,
    ViewSelectComponent,
    ProbabilityToolComponent,
    CropAnalysisComponent
  ],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PicsaTranslateModule,
    ClimateMaterialModule,
    PicsaChartsModule
  ],
  exports: [
    ClimateChartComponent,
    CombinedProbabilityComponent,
    ViewSelectComponent,
    ProbabilityToolComponent,
    CropAnalysisComponent
  ]
})
export class ClimateToolComponentsModule {}
