import { Routes } from '@angular/router';

export const TOOL_ROUTES: Routes = [
  // support embed of budget tool app
  // see: https://medium.com/disney-streaming/combining-multiple-angular-applications-into-a-single-one-e87d530d6527
  {
    path: 'budget',
    loadChildren: () => import('@picsa/budget/src/app/app.module-embedded').then((mod) => mod.BudgetToolModule),
  },
  {
    path: 'climate',
    loadChildren: () => import('@picsa/climate/src/app/app.module-embedded').then((mod) => mod.ClimateToolModule),
  },
  {
    path: 'crop-probability',
    loadChildren: () =>
      import('@picsa/crop-probability/src/app/app.module-embedded').then((mod) => mod.CropProbabilityToolModule),
  },
  {
    path: 'forecast',
    loadComponent: () => import('@picsa/forecasts/pages/forecast/forecast.page').then((mod) => mod.ForecastComponent),
  },
  {
    path: 'monitoring',
    loadChildren: () => import('@picsa/monitoring/src/app/app.module-embedded').then((mod) => mod.MonitoringToolModule),
  },
  {
    path: 'manual',
    loadChildren: () => import('@picsa/manual/src/app/app.module-embedded').then((mod) => mod.ManualToolModule),
  },
  {
    path: 'option',
    loadChildren: () => import('@picsa/option/src/app/app.module-embedded').then((mod) => mod.OptionsToolModule),
  },
  {
    path: 'resources',
    loadChildren: () => import('@picsa/resources/src/app/app.module-embedded').then((mod) => mod.ResourcesToolModule),
  },
  {
    path: 'seasonal-calendar',
    loadChildren: () =>
      import('@picsa/seasonal-calendar/src/app/app.module-embedded').then((mod) => mod.SeasonalCalendarToolModule),
  },
];
