import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

export const ROUTES_COMMON: Routes = [
  {
    path: '',
    loadChildren: () => import('./pages/home/home.module').then((m) => m.HomeModule),
    title: 'Resources',
  },
  {
    path: 'collection',
    loadChildren: () => import('./pages/collection/collection.module').then((m) => m.CollectionModule),
  },
  {
    path: 'downloads',
    loadChildren: () => import('./pages/downloads/downloads.module').then((m) => m.DownloadsModule),
  },
  {
    path: 'search',
    loadChildren: () => import('./pages/search/search.module').then((m) => m.SearchModule),
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
