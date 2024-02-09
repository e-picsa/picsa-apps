import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ClimateForecastPageComponent } from './pages/forecast/forecast.component';
import { ClimateStationPageComponent } from './pages/station/station.component';
import { StationDetailsPageComponent } from './pages/station-details/station-details.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        redirectTo: 'station',
        pathMatch: 'full',
      },
      {
        path: 'station',
        component: ClimateStationPageComponent,
      },
      {
        path: 'forecast',
        component: ClimateForecastPageComponent,
      },
      {
        path: 'station/:stationId',
        component: StationDetailsPageComponent,
      },
    ]),
  ],
})
export class ClimateModule {}
