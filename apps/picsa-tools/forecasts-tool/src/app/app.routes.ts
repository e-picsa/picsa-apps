import { Routes } from '@angular/router';

import { ForecastComponent } from './pages/forecast/forecast.page';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/forecast/forecast.page').then((mod) => mod.ForecastComponent),
  },
];
