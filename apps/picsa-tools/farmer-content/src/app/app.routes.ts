import { Route } from '@angular/router';

import { FarmerToolPlaceholderComponent } from './pages/tool/farmer-tool.component';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./pages/home/farmer-home.component').then((mod) => mod.FarmerContentHomeComponent),
    title: 'PICSA',
  },
  {
    path: ':slug',
    loadComponent: () =>
      import('./pages/module-landing/module-landing.component').then((mod) => mod.FarmerModuleLandingComponent),
    title: 'PICSA',
  },
  {
    path: ':slug/:stepIndex',
    loadComponent: () =>
      import('./pages/module-home/module-home.component').then((mod) => mod.FarmerContentModuleHomeComponent),
    children: [
      {
        path: ':toolId',
        component: FarmerToolPlaceholderComponent,
      },
    ],
  },
  {
    path: 'tool/:toolId',
    component: FarmerToolPlaceholderComponent,
  },
];

/** Routes only registered in standalone mode */
const ROUTES_STANDALONE: Route[] = [{ path: '**', redirectTo: '' }];
