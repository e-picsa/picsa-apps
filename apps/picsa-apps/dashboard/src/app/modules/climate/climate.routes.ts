import { defineFeature } from '../../utils/route-utils';

export const ClimateFeature = defineFeature({
  rootPath: 'climate',
  navLabel: 'Climate',
  matIcon: 'filter_drama',
  routes: [
    {
      path: '',
      redirectTo: 'station',
      pathMatch: 'full',
    },
    {
      path: 'admin',
      loadComponent: () => import('./pages/admin/admin.component').then((m) => m.ClimateAdminPageComponent),
      roleRequired: 'climate.admin',
    },
    {
      path: 'station',
      navLabel: 'Station Data',
      loadComponent: () => import('./pages/station/station.component').then((m) => m.ClimateStationPageComponent),
    },
    {
      path: 'forecast',
      navLabel: 'Forecasts',
      loadComponent: () => import('./pages/forecast/forecast.component').then((m) => m.ClimateForecastPageComponent),
    },
    {
      path: 'station/:stationId',
      loadComponent: () =>
        import('./pages/station-details/station-details.component').then((m) => m.StationDetailsPageComponent),
    },
  ],
});
