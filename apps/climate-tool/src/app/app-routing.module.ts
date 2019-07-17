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
