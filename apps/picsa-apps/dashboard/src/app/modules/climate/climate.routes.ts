import { defineFeature } from '../../utils/route-utils';

export const ClimateFeature = defineFeature({
  path: 'climate',
  nav: {
    label: 'Climate',
    icon: 'filter_drama',
  },
  children: [
    {
      path: '',
      redirectTo: 'station',
      pathMatch: 'full',
    },
    {
      path: 'station',
      nav: { label: 'Station Data' },
      loadComponent: () => import('./pages/station/station.component').then((m) => m.ClimateStationPageComponent),
    },
    {
      path: 'station/:stationId',
      loadComponent: () =>
        import('./pages/station-details/station-details.component').then((m) => m.StationDetailsPageComponent),
    },
    {
      path: 'forecast',
      nav: { label: 'Forecasts' },
      loadComponent: () => import('./pages/forecast/forecast.component').then((m) => m.ClimateForecastPageComponent),
    },

    {
      path: 'admin',
      loadComponent: () => import('./pages/admin/admin.component').then((m) => m.ClimateAdminPageComponent),
      roleRequired: 'climate.admin',
    },
  ],
});
