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
// const embeddedRoutes = addRoutePrefix(commonRoutes);
const embeddedRoutes = [
  {
    path: 'climate',
    loadChildren: () =>
      import('./pages/site-select/site-select.module').then(
        mod => mod.ClimateSiteSelectPageModule
      )
  },
  {
    path: 'climate/site/:siteId',
    loadChildren: () =>
      import('./pages/site-view/site-view.module').then(
        mod => mod.ClimateSiteViewPageModule
      )
  }
  // { path: '', redirectTo: '/site', pathMatch: 'full' }
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
  imports: [RouterModule.forChild(embeddedRoutes)],
  exports: [RouterModule]
})
export class ClimateToolRoutingModule {}

// note, whilst child routing should automatically add and handle prefixes,
// currently if there is conflict (e.g. '' or 'home') routes don't resolve correctly
// possibly linked to multiple router outlets, for now just add prefixes
export function addRoutePrefix(routes: Routes) {
  return routes.map(r => {
    return {
      ...r,
      path: `climate${r.path === '' ? '' : '/' + r.path}`
    };
  });
}
