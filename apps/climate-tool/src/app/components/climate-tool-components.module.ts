import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { TranslationsProvider } from '@picsa/core/services';
import { ClimateChartComponent } from './climate-chart/climate-chart';
import { CombinedProbabilityComponent } from './combined-probability/combined-probability';
import { SiteSelectComponent } from './site-select/site-select';

@NgModule({
  declarations: [
    ClimateChartComponent,
    CombinedProbabilityComponent,
    SiteSelectComponent
  ],
  imports: [IonicModule, TranslateModule.forChild()],
  exports: [
    ClimateChartComponent,
    CombinedProbabilityComponent,
    SiteSelectComponent
  ],
  providers: [TranslationsProvider]
})
export class ClimateToolComponentsModule {}
