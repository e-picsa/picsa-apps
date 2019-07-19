import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'climate/site-select',
    loadChildren: () =>
      import('./pages/site-select/site-select.module').then(
        mod => mod.ClimateSiteSelectPageModule
      )
  },
  {
    path: 'climate/view/:siteId',
    loadChildren: () =>
      import('./pages/view/climate-view.module').then(
        mod => mod.ClimateViewPageModule
      )
  },
  { path: 'climate', redirectTo: 'climate/site-select' },
  { path: '**', redirectTo: 'climate/site-select' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
