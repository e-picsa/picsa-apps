import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./pages/home/farmer-home.component').then((mod) => mod.FarmerContentHomeComponent),
  },
  {
    path: ':slug',
    loadComponent: () =>
      import('./pages/module-home/module-home.component').then((mod) => mod.FarmerContentModuleHomeComponent),
  },
];
