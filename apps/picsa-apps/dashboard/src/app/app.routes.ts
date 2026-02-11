import { Route } from '@angular/router';

import { AdminFeature } from './modules/admin/admin.routes';
import { authRoleGuard } from './modules/auth/guards/auth-role.guard';
import { ClimateFeature } from './modules/climate/climate.routes';
import { CropFeature } from './modules/crop-information/crop.routes';
import { MonitoringFeature } from './modules/monitoring/monitoring.routes';

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
    path: 'privacy-policy',
    loadComponent: () =>
      import('./modules/legal/privacy-policy/privacy-policy.component').then((m) => m.PrivacyPolicyComponent),
  },
  {
    path: 'terms-of-service',
    loadComponent: () =>
      import('./modules/legal/terms-of-service/terms-of-service.component').then((m) => m.TermsOfServiceComponent),
  },
  {
    path: ClimateFeature.ROOT_PATH,
    loadChildren: () => import('./modules/climate/climate.module').then((m) => m.ClimateModule),
  },
  {
    path: 'deployment',
    loadChildren: () => import('./modules/deployment/deployment.module').then((m) => m.DeploymentModule),
    canActivate: [authRoleGuard('deployments.admin')],
  },
  {
    path: 'translations',
    loadChildren: () => import('./modules/translations/translations.module').then((m) => m.TranslationsPageModule),
  },
  // unmatched routes fallback to home
  {
    path: CropFeature.ROOT_PATH,
    loadChildren: () =>
      import('./modules/crop-information/crop-information.module').then((m) => m.CropInformationModule),
  },
  {
    path: MonitoringFeature.ROOT_PATH,
    loadChildren: () => import('./modules/monitoring/monitoring-forms.module').then((m) => m.MonitoringFormsPageModule),
    canActivate: [authRoleGuard('monitoring.admin')],
  },
  {
    path: 'profile',
    loadChildren: () => import('./modules/profile/profile.module').then((m) => m.ProfileModule),
  },
  {
    path: AdminFeature.ROOT_PATH,
    loadChildren: () => import('./modules/admin/admin.module').then((m) => m.AdminModule),
    canActivate: [authRoleGuard('admin')],
  },
  {
    path: 'stats',
    loadChildren: () => import('./modules/stats/stats.module').then((m) => m.StatsModule),
  },
  {
    path: '**',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
