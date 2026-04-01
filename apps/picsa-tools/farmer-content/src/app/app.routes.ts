import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./pages/home/farmer-home.component').then((mod) => mod.FarmerContentHomeComponent),
    title: 'PICSA',
  },
  {
    path: 'tool',
    loadComponent: () => import('./pages/tool/farmer-tool.component').then((mod) => mod.FarmerToolPlaceholderComponent),
    loadChildren: () => {
      return [
        {
          path: ':toolId',
          loadComponent: () =>
            import('./pages/tool/farmer-tool.component').then((mod) => mod.FarmerToolPlaceholderComponent),
        },
      ];
    },
    title: 'PICSA',
  },
  {
    path: ':slug',
    loadComponent: () =>
      import('./pages/module-home/module-home.component').then((mod) => mod.FarmerContentModuleHomeComponent),
    children: [
      {
        path: ':toolId',
        loadComponent: () =>
          import('./pages/tool/farmer-tool.component').then((mod) => mod.FarmerToolPlaceholderComponent),
      },
    ],
  },
];

/** Routes only registered in standalone mode */
const ROUTES_STANDALONE: Route[] = [{ path: '**', redirectTo: '' }];
