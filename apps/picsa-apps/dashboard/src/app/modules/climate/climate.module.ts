import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ClimateDataHomeComponent } from './pages/home/climate-data-home.component';
import { StationPageComponent } from './pages/station/station-page.component';

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
        component: StationPageComponent,
      },
    ]),
  ],
})
export class ClimateModule {}
