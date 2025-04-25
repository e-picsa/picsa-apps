import { Route } from '@angular/router';

import { FarmerToolPlaceholderComponent } from './pages/tool/farmer-tool.component';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./pages/home/farmer-home.component').then((mod) => mod.FarmerContentHomeComponent),
    title: 'PICSA',
  },
  {
    path: 'tool',
    component: FarmerToolPlaceholderComponent,
    loadChildren: () => {
      return [
        {
          path: ':toolId',
          component: FarmerToolPlaceholderComponent,
        },
      ];
    },
    title: 'PICSA',
  },
  {
    path: ':slug',
    // TODO - make non-standalone to work with tools (or get tools to work standalone)
    loadComponent: () =>
      import('./pages/module-home/module-home.component').then((mod) => mod.FarmerContentModuleHomeComponent),
    children: [
      {
        path: ':toolId',
        component: FarmerToolPlaceholderComponent,
      },
    ],
  },
];

/** Routes only registered in standalone mode */
const ROUTES_STANDALONE: Route[] = [{ path: '**', redirectTo: '' }];
