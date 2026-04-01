import { Routes } from '@angular/router';

export const ROUTES_COMMON: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/enterprise-select/enterprise-select.component').then((m) => m.EnterpriseSelectComponent),
    title: 'Options',
  },
  {
    path: ':enterprise',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'Options',
  },
];

/** Routes only registered in standalone mode */
const ROUTES_STANDALONE: Routes = [{ path: '**', redirectTo: '' }];

export const OPTION_ROUTES: Routes = ROUTES_COMMON;
export const appRoutes: Routes = [...ROUTES_COMMON, ...ROUTES_STANDALONE];
