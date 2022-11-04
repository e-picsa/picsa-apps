/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BudgetToolModule } from '@picsa/budget/src/app/app.module-embedded';
import { ClimateToolModule } from '@picsa/climate/src/app/app.module-embedded';
import { MonitoringToolModule } from '@picsa/monitoring/src/app/app.module-embedded';
import { ResourcesToolModule } from '@picsa/resources/src/app/app.module-embedded';

const routes: Routes = [
  // support embed of budget tool app
  // see: https://medium.com/disney-streaming/combining-multiple-angular-applications-into-a-single-one-e87d530d6527
  {
    path: 'budget',
    loadChildren: () =>
      import('@picsa/budget/src/app/app.module-embedded').then(
        (mod) => mod.BudgetToolModule
      ),
  },
  {
    path: 'climate',
    loadChildren: () =>
      import('@picsa/climate/src/app/app.module-embedded').then(
        (mod) => mod.ClimateToolModule
      ),
  },
  {
    path: 'monitoring',
    loadChildren: () =>
      import('@picsa/monitoring/src/app/app.module-embedded').then(
        (mod) => mod.MonitoringToolModule
      ),
  },
  {
    path: 'resources',
    loadChildren: () =>
      import('@picsa/resources/src/app/app.module-embedded').then(
        (mod) => mod.ResourcesToolModule
      ),
  },
  {
    path: '',
    loadChildren: () =>
      import('./pages/home/home.module').then((mod) => mod.HomePageModule),
    title: 'PICSA',
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
    title: 'Discussions',
  },
  {
    path: 'data',
    loadChildren: () =>
      import('./pages/data/data.module').then((mod) => mod.DataPageModule),
  },
  {
    path: 'privacy',
    loadChildren: () =>
      import('./pages/privacy/privacy.module').then((mod) => mod.PrivacyModule),
  },

  // { path: '**', redirectTo: '/home' }
  // NOTE - multiple 'catch-all' with sub apps causes issues
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    ClimateToolModule.forRoot({ urlPrefix: 'climate' }),
    BudgetToolModule.forRoot({ urlPrefix: 'budget' }),
    MonitoringToolModule.forRoot({ urlPrefix: 'monitoring' }),
    ResourcesToolModule.forRoot({ urlPrefix: 'resources' }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
