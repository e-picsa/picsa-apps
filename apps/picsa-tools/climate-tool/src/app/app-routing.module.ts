import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

export const ROUTES_COMMON: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./pages/site-select/site-select.module').then(
        (mod) => mod.ClimateSiteSelectPageModule
      ),
    title: 'Select a site',
  },
  {
    path: 'site/:siteId',
    loadChildren: () =>
      import('./pages/site-view/site-view.module').then(
        (mod) => mod.ClimateSiteViewPageModule
      ),
  },
  {
    path: 'site',
    redirectTo: '',
    pathMatch: 'full',
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
