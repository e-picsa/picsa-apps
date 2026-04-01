/* eslint-disable @nx/enforce-module-boundaries */
import { Routes } from '@angular/router';

export const TOOL_ROUTES: Routes = [
  {
    path: 'budget',
    loadChildren: () => import('@picsa/budget/src/app/app.routes').then((mod) => mod.BUDGET_ROUTES),
  },
  {
    path: 'climate',
    loadChildren: () => import('@picsa/climate/src/app/app.routes').then((mod) => mod.CLIMATE_ROUTES),
  },
  {
    path: 'crop-probability',
    loadChildren: () => import('@picsa/crop-probability/src/app/app.routes').then((mod) => mod.CROP_PROBABILITY_ROUTES),
  },
  {
    path: 'forecasts',
    loadComponent: () => import('@picsa/forecasts/pages/forecast/forecast.page').then((mod) => mod.ForecastComponent),
  },
  {
    path: 'monitoring',
    loadChildren: () => import('@picsa/monitoring/src/app/app.routes').then((mod) => mod.MONITORING_ROUTES),
  },
  {
    path: 'manual',
    loadChildren: () => import('@picsa/manual/src/app/app.routes').then((mod) => mod.MANUAL_ROUTES),
  },
  {
    path: 'option',
    loadChildren: () => import('@picsa/option/src/app/app.routes').then((mod) => mod.OPTION_ROUTES),
  },
  {
    path: 'resources',
    loadChildren: () => import('@picsa/resources/app.routes').then((mod) => mod.RESOURCES_ROUTES),
  },
  {
    path: 'seasonal-calendar',
    loadChildren: () =>
      import('@picsa/seasonal-calendar/src/app/app.routes').then((mod) => mod.SEASONAL_CALENDAR_ROUTES),
  },
];
