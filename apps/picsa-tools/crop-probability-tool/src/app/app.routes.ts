import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

export const ROUTES_COMMON: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'Crop Probability',
  },
  {
    path: ':stationId',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'Crop Probability',
  },
];
/** Routes only registered in standalone mode */
const ROUTES_STANDALONE: Routes = [{ path: '**', redirectTo: '' }];

export const CROP_PROBABILITY_ROUTES: Routes = ROUTES_COMMON;
export const appRoutes: Routes = [...ROUTES_COMMON, ...ROUTES_STANDALONE];
