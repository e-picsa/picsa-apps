import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PicsaMapComponent } from '@picsa/shared/features/map/map';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';

import { ClimateToolComponentsModule } from '../../components/climate-tool-components.module';
import { ClimateForecastPage } from './forecast.page';
import { PdfViewerComponent } from '@picsa/shared/features';

const routes: Routes = [
  {
    path: '',
    component: ClimateForecastPage,
    title: 'Climate Forecast'
  },
];

@NgModule({
  imports: [
    CommonModule,
    ClimateToolComponentsModule,
    RouterModule.forChild(routes),
    PicsaTranslateModule,
    PicsaMapComponent,
    PdfViewerComponent,
  ],
  declarations: [ClimateForecastPage],
})
export class ClimateForecastPageModule {}
