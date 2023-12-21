import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'resources',
    loadChildren: () => import('./modules/resources/resources.module').then((m) => m.ResourcesPageModule),
  },
  {
    path: 'climate-data',
    loadChildren: () => import('./modules/climate-data/climate-data.module').then((m) => m.ClimateDataModule),
  },
];
