import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./pages/home/farmer-home.component').then((mod) => mod.PicsaFarmerHomeComponent),
  },
];
