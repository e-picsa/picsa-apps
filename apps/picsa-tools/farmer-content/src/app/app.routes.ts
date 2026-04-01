import { Routes } from '@angular/router';

export function buildFarmerRoutes(nestedTools: Routes): Routes {
  return [
    {
      path: '',
      loadComponent: () => import('./pages/home/farmer-home.component').then((mod) => mod.FarmerContentHomeComponent),
      title: 'PICSA',
    },
    // Tool debug page
    {
      path: 'tool',
      loadComponent: () =>
        import('./pages/tool/farmer-tool.component').then((mod) => mod.FarmerToolPlaceholderComponent),
      children: nestedTools,
      title: 'PICSA',
    },
    {
      path: ':slug',
      loadComponent: () =>
        import('./pages/module-home/module-home.component').then((mod) => mod.FarmerContentModuleHomeComponent),
      children: nestedTools,
    },
  ];
}

/** Routes only registered in standalone mode */
export const ROUTES_STANDALONE: Routes = [{ path: '**', redirectTo: '' }];

export const FAKE_TOOL_ROUTES: Routes = [
  {
    path: ':toolId',
    loadComponent: () => import('./pages/tool/farmer-tool.component').then((mod) => mod.FarmerToolPlaceholderComponent),
  },
];

export const appRoutes: Routes = buildFarmerRoutes(FAKE_TOOL_ROUTES);
