import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

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
        path: 'admin',
        loadComponent: () => import('./pages/admin/admin.component').then((m) => m.ClimateAdminPageComponent),
        // TODO - add auth route guards
      },
      {
        path: 'station',
        loadComponent: () => import('./pages/station/station.component').then((m) => m.ClimateStationPageComponent),
      },
      {
        path: 'forecast',
        loadComponent: () => import('./pages/forecast/forecast.component').then((m) => m.ClimateForecastPageComponent),
      },
      {
        path: 'station/:stationId',
        loadComponent: () =>
          import('./pages/station-details/station-details.component').then((m) => m.StationDetailsPageComponent),
      },
    ]),
  ],
})
export class ClimateModule {}
