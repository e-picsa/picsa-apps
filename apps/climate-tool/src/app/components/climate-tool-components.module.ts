import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ClimateChartComponent } from './climate-chart/climate-chart';
import { CombinedProbabilityComponent } from './combined-probability/combined-probability';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ChartSelectComponent } from './chart-select/chart-select';
import { PicsaTranslateModule } from '@picsa/modules';
import { PicsaMaterialModule } from '../material.module';

@NgModule({
  declarations: [
    ClimateChartComponent,
    CombinedProbabilityComponent,
    ChartSelectComponent
  ],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PicsaTranslateModule,
    PicsaMaterialModule
  ],
  exports: [
    ClimateChartComponent,
    CombinedProbabilityComponent,
    ChartSelectComponent
  ]
})
export class ClimateToolComponentsModule {}
