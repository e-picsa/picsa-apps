import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'resources',
    loadChildren: () => import('./pages/resources/resources.module').then((m) => m.ResourcesPageModule),
  },
];
