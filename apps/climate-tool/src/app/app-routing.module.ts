import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const commonRoutes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./pages/site-select/site-select.module').then(
        mod => mod.ClimateSiteSelectPageModule
      )
  },
  {
    path: 'site/:siteId',
    loadChildren: () =>
      import('./pages/site-view/site-view.module').then(
        mod => mod.ClimateSiteViewPageModule
      )
  }
  // { path: '', redirectTo: '/site', pathMatch: 'full' }
];
// catch-all routes conflict when embedded, so only use in standalone
const standaloneRoutes: Routes = [
  // { path: '**', redirectTo: '/site' }
];

/*******************************************************************
 *  Standalone Version
 ******************************************************************/
@NgModule({
  imports: [
    RouterModule.forRoot([...commonRoutes, ...standaloneRoutes], {
      preloadingStrategy: PreloadAllModules
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}

/*******************************************************************
 *  Embedded Version (requires standalone imports in master app)
 ******************************************************************/
@NgModule({
  imports: [RouterModule.forChild(commonRoutes)],
  exports: [RouterModule]
})
export class ClimateToolRoutingModule {}
