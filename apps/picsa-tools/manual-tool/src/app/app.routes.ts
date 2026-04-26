import { Routes } from '@angular/router';

export const ROUTES_COMMON: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'PICSA Manual',
  },
];
/** Routes only registered in standalone mode */
const ROUTES_STANDALONE: Routes = [{ path: '**', redirectTo: '' }];

export const MANUAL_ROUTES: Routes = ROUTES_COMMON;
export const appRoutes: Routes = [...ROUTES_COMMON, ...ROUTES_STANDALONE];
