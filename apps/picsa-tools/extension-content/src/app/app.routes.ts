import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./pages/home/extension-home.component').then((mod) => mod.ExtensionHomeComponent),
  },
];
