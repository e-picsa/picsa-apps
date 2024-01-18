import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'resources',
    loadChildren: () => import('./pages/resources/resources.module').then((m) => m.ResourcesPageModule),
  },
  {
    path: 'crop-information',
    loadChildren: () => import('./pages/crop-information/crop-information.module').then((m) => m.CropInformationModule),
  },
];
