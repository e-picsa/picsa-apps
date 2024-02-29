import { Route } from '@angular/router';

import { DashboardHomeComponent } from './modules/home/home.component';

export const appRoutes: Route[] = [
  {
    path: 'home',
    component: DashboardHomeComponent,
  },
  {
    path: 'resources',
    loadChildren: () => import('./modules/resources/resources.module').then((m) => m.ResourcesPageModule),
  },
  {
    path: 'climate',
    loadChildren: () => import('./modules/climate/climate.module').then((m) => m.ClimateModule),
  },
  {
    path: 'deployment',
    loadChildren: () => import('./modules/deployment/deployment.module').then((m) => m.DeploymentModule),
  },
  {
    path: 'translations',
    loadChildren: () => import('./modules/translations/translations.module').then((m) => m.TranslationsPageModule),
  },

  // unmatched routes fallback to home
  {
    path: '**',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
