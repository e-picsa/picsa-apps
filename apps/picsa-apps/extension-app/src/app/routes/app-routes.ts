import { Routes } from '@angular/router';
import { appRoutes as extensionContentRoutes } from '@picsa/extension-content/src/app/app.routes';

export const APP_ROUTES: Routes = [
  // Updated syntax for standalone components (other routes could be migrated in similar way)
  // Import farmer-content routes which lazy-load on /farmer endpoint
  // Use component-less top route to enforce route guard on all child routes
  {
    path: 'farmer',
    canActivate: [],
    // children: farmerContentRoutes,
    loadChildren: () =>
      import('@picsa/farmer-content/src/app/app.module-embedded').then((mod) => mod.FarmerContentModule),
    title: 'PICSA',
  },
  {
    path: 'extension',
    canActivate: [],
    children: extensionContentRoutes,
    title: 'PICSA',
  },

  // NOTE - Home not currently working as standalone component so keeping as module
  // (possibly needs to import router-outlet or similar for setup)
  {
    path: '',
    loadChildren: () => import('../pages/home/home.module').then((mod) => mod.HomePageModule),
    title: 'PICSA',
  },

  {
    path: 'privacy',
    loadChildren: () => import('../pages/privacy/privacy.module').then((mod) => mod.PrivacyModule),
  },
  {
    path: 'error',
    loadChildren: () => import('../pages/error/error.module').then((mod) => mod.ErrorPageModule),
  },

  // { path: '**', redirectTo: '/home' }
  // NOTE - multiple 'catch-all' with sub apps causes issues
];
