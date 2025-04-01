import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

export const ROUTES_COMMON: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'Resources',
  },
  {
    path: 'collection',
    loadChildren: () => import('./pages/collection/collection-routing.module').then((m) => m.CollectionRoutingModule),
    title: 'Collection',
  },

  {
    path: 'downloads',
    loadComponent: () => import('./pages/downloads/downloads.page').then((m) => m.DownloadsPageComponent),
    title: 'Downloads',
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search/search.component').then((m) => m.ResourceSearchComponent),
    title: 'Search',
  },
];
/** Routes only registered in standalone mode */
const ROUTES_STANDALONE: Routes = [{ path: '**', redirectTo: '' }];

/*******************************************************************
 *  Standalone Version
 ******************************************************************/
@NgModule({
  imports: [
    RouterModule.forRoot([...ROUTES_COMMON, ...ROUTES_STANDALONE], {
      preloadingStrategy: PreloadAllModules,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
