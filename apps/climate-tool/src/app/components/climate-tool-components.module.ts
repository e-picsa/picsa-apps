import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ClimateChartComponent } from './climate-chart/climate-chart';
import { CombinedProbabilityComponent } from './combined-probability/combined-probability';
import { SiteSelectComponent } from './site-select/site-select';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    ClimateChartComponent,
    CombinedProbabilityComponent,
    SiteSelectComponent
  ],
  imports: [IonicModule, CommonModule],
  exports: [
    ClimateChartComponent,
    CombinedProbabilityComponent,
    SiteSelectComponent
  ]
})
export class ClimateToolComponentsModule {}
