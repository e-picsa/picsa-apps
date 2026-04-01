import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

export const ROUTES_COMMON: Routes = [
  {
    path: '',
    loadChildren: () => import('./pages/home/home.module').then((m) => m.HomeModule),
    title: 'PICSA Manual',
  },
];
/** Routes only registered in standalone mode */
const ROUTES_STANDALONE: Routes = [{ path: '**', redirectTo: '' }];

export const MANUAL_ROUTES: Routes = ROUTES_COMMON;
export const appRoutes: Routes = [...ROUTES_COMMON, ...ROUTES_STANDALONE];
