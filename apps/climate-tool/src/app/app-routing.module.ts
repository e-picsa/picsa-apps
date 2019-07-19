import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'climate/home',
    loadChildren: () =>
      import('./pages/home/climate-home.module').then(
        mod => mod.ClimateHomePageModule
      )
  },
  {
    path: 'climate/site-select',
    loadChildren: () =>
      import('./pages/site-select/site-select.module').then(
        mod => mod.ClimateSiteSelectPageModule
      )
  },
  { path: 'climate', redirectTo: 'climate/home' },
  { path: '**', redirectTo: 'climate/home' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
