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
  {
    path: 'form-preview',
    loadChildren:() => import('./modules/form-preview/form-preview.module').then((m) => m.FormPreviewModule)
  },

  // unmatched routes fallback to home
  {
    path: 'crop',
    loadChildren: () =>
      import('./modules/crop-information/crop-information.module').then((m) => m.CropInformationModule),
  },
  {
    path: 'monitoring',
    loadChildren: () => import('./modules/monitoring/monitoring-forms.module').then((m) => m.MonitoringFormsPageModule),
  },
  {
    path: 'profile',
    loadChildren: () => import('./modules/profile/profile.module').then((m) => m.ProfileModule),
  },
  {
    path: '**',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
