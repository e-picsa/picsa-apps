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
  {
    path: 'translations',
    loadChildren: () => import('./modules/translations/translations.module').then((m) => m.TranslationsPageModule),
  },
  {
    path: 'crop',
    loadChildren: () =>
      import('./modules/crop-information/crop-information.module').then((m) => m.CropInformationModule),
  },
  {
    path: '',
    redirectTo: 'resources',
    pathMatch: 'full',
  },
];
