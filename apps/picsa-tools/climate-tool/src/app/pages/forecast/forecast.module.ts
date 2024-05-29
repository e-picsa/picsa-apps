import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PicsaMapComponent } from '@picsa/shared/features/map/map';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';

import { ClimateToolComponentsModule } from '../../components/climate-tool-components.module';
import { ClimateForecastPage } from './forecast.page';

const routes: Routes = [
  {
    path: '/forecast',
    component: ClimateForecastPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    ClimateToolComponentsModule,
    RouterModule.forChild(routes),
    PicsaTranslateModule,
    PicsaMapComponent,
  ],
  declarations: [ClimateForecastPage],
})
export class ClimateForecastPageModule {}
