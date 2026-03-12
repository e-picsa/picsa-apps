import { Route } from '@angular/router';

import { ClimateFeature } from './modules/climate/climate.routes';
import { CropFeature } from './modules/crop-information/crop.routes';
import { DeploymentFeature } from './modules/deployment/deployment.routes';
import { HomeFeature } from './modules/home/home.routes';
import { MapFeature } from './modules/map/map.routes';
import { MonitoringFeature } from './modules/monitoring/monitoring.routes';
import { ResourcesFeature } from './modules/resources/resources.routes';
import { StatsFeature } from './modules/stats/stats.routes';
import { TranslationsFeature } from './modules/translations/translations.routes';

export const appRoutes: Route[] = [
  {
    path: HomeFeature.ROOT_PATH,
    loadChildren: () => import('./modules/home/home.routes').then((m) => m.HomeFeature.ROUTES),
  },
  {
    path: ResourcesFeature.ROOT_PATH,
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
    path: DeploymentFeature.ROOT_PATH,
    loadChildren: () => import('./modules/deployment/deployment.module').then((m) => m.DeploymentModule),
  },
  {
    path: TranslationsFeature.ROOT_PATH,
    loadChildren: () => import('./modules/translations/translations.module').then((m) => m.TranslationsPageModule),
  },
  {
    path: CropFeature.ROOT_PATH,
    loadChildren: () =>
      import('./modules/crop-information/crop-information.module').then((m) => m.CropInformationModule),
  },
  {
    path: MonitoringFeature.ROOT_PATH,
    loadChildren: () => import('./modules/monitoring/monitoring-forms.module').then((m) => m.MonitoringFormsPageModule),
  },
  {
    path: 'profile',
    loadChildren: () => import('./modules/profile/profile.module').then((m) => m.ProfileModule),
  },
  {
    path: StatsFeature.ROOT_PATH,
    loadChildren: () => import('./modules/stats/stats.module').then((m) => m.StatsModule),
  },
  {
    path: MapFeature.ROOT_PATH,
    loadChildren: () => import('./modules/map/map.routes').then((m) => m.MapFeature.ROUTES),
  },
  {
    path: '**',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
