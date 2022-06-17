/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BudgetToolModule } from '@picsa/budget/src/app/app-embedded.module';
import { ClimateToolModule } from '@picsa/climate/src/app/app.module';

const routes: Routes = [
  // support embed of budget tool app
  // see: https://medium.com/disney-streaming/combining-multiple-angular-applications-into-a-single-one-e87d530d6527
  {
    path: 'budget',
    loadChildren: () =>
      import('@picsa/budget/src/app/app-embedded.module').then(
        (mod) => mod.BudgetToolModule
      ),
  },
  {
    path: 'climate',
    loadChildren: () =>
      import('@picsa/climate/src/app/app.module').then(
        (mod) => mod.ClimateToolModule
      ),
  },
  {
    path: 'resources',
    loadChildren: () =>
      import('./pages/resources/resources.module').then(
        (mod) => mod.ResourcesPageModule
      ),
  },
  {
    path: '',
    loadChildren: () =>
      import('./pages/home/home.module').then((mod) => mod.HomePageModule),
  },
  {
    path: 'settings',
    loadChildren: () =>
      import('./pages/settings/settings.module').then(
        (mod) => mod.SettingsPageModule
      ),
  },
  {
    path: 'discussions',
    loadChildren: () =>
      import('./pages/discussions/discussions.module').then(
        (mod) => mod.DiscussionsPageModule
      ),
  },
  {
    path: 'data',
    loadChildren: () =>
      import('./pages/data/data.module').then((mod) => mod.DataPageModule),
  },
  // { path: '**', redirectTo: '/home' }
  // NOTE - multiple 'catch-all' with sub apps causes issues
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    ClimateToolModule.forRoot(),
    BudgetToolModule.forRoot({ urlPrefix: 'budget' }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
