/* eslint-disable @nx/enforce-module-boundaries */
import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  // Updated syntax for standalone components (other routes could be migrated in similar way)
  // Import farmer-content routes which lazy-load on /farmer endpoint
  // Use component-less top route to enforce route guard on all child routes
  {
    path: 'farmer',
    canActivate: [],
    loadChildren: () => import('@picsa/farmer-content/src/app/app.routes').then((mod) => mod.appRoutes),
    title: 'PICSA',
  },
  {
    path: 'extension',
    canActivate: [],
    loadChildren: () => import('@picsa/extension-content/src/app/app.routes').then((mod) => mod.appRoutes),
    title: 'PICSA',
  },
  // Photos debug page
  {
    path: 'photos',
    loadComponent: () => import('@picsa/shared/features/photo').then((mod) => mod.PhotoDebugComponent),
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
