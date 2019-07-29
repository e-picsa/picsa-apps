import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'climate/site',
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
  },
  { path: 'climate', redirectTo: 'climate/site' },
  { path: '**', redirectTo: 'climate/site' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
