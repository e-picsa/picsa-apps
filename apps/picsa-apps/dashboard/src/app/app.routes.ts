import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'home',
    loadComponent: () => import('./modules/home/home.component').then((m) => m.DashboardHomeComponent),
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
    path: 'admin',
    loadChildren: () => import('./modules/admin/admin.module').then((m) => m.AdminModule),
  },
  {
    path: '**',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
