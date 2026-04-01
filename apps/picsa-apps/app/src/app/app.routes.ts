/* eslint-disable @nx/enforce-module-boundaries */
import { Routes } from '@angular/router';

/** Tools reused in /farmer as well as base */
const TOOL_ROUTES: Routes = [
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

export const appRoutes: Routes = [
  ...TOOL_ROUTES,
  {
    path: 'extension',
    canActivate: [],
    loadChildren: () => import('@picsa/extension-content/src/app/app.routes').then((mod) => mod.appRoutes),
    title: 'PICSA',
  },
  // Photos debug page
  {
    path: 'photos',
    loadComponent: () => import('@picsa/shared/features/photo').then((mod) => mod.PhotoDebugComponent),
  },

  // NOTE - Home not currently working as standalone component so keeping as module
  // (possibly needs to import router-outlet or similar for setup)
  {
    path: '',
    loadChildren: () => import('./pages/home/home.module').then((mod) => mod.HomePageModule),
    title: 'PICSA',
  },

  {
    path: 'privacy',
    loadChildren: () => import('./pages/privacy/privacy.module').then((mod) => mod.PrivacyModule),
  },
  {
    path: 'error',
    loadChildren: () => import('./pages/error/error.module').then((mod) => mod.ErrorPageModule),
  },
  {
    path: 'farmer',
    loadChildren: () =>
      import('@picsa/farmer-content/src/app/app.routes').then((m) => m.buildFarmerRoutes(TOOL_ROUTES)),
    title: 'PICSA',
  },
];
