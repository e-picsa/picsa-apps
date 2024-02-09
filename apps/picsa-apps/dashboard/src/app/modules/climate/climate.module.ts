import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ClimateDataHomeComponent } from './pages/home/climate-data-home.component';
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
        component: ClimateDataHomeComponent,
      },
      {
        path: 'station/:stationId',
        component: StationDetailsPageComponent,
      },
    ]),
  ],
})
export class ClimateModule {}
