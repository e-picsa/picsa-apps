/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BudgetToolModule } from '@picsa/budget/src/app/app.module-embedded';
import { ClimateToolModule } from '@picsa/climate/src/app/app.module-embedded';
import { CropProbabilityToolModule } from '@picsa/crop-probability/src/app/app.module-embedded';
import { ManualToolModule } from '@picsa/manual/src/app/app.module-embedded';
import { MonitoringToolModule } from '@picsa/monitoring/src/app/app.module-embedded';
import { OptionsToolModule } from '@picsa/option/src/app/app.module-embedded';
import { ResourcesToolModule } from '@picsa/resources/src/app/app.module-embedded';

const routes: Routes = [
  // support embed of budget tool app
  // see: https://medium.com/disney-streaming/combining-multiple-angular-applications-into-a-single-one-e87d530d6527
  {
    path: 'budget',
    loadChildren: () => import('@picsa/budget/src/app/app.module-embedded').then((mod) => mod.BudgetToolModule),
  },
  {
    path: 'climate',
    loadChildren: () => import('@picsa/climate/src/app/app.module-embedded').then((mod) => mod.ClimateToolModule),
  },
  {
    path: 'crop-probability',
    loadChildren: () =>
      import('@picsa/crop-probability/src/app/app.module-embedded').then((mod) => mod.CropProbabilityToolModule),
  },
  {
    path: 'monitoring',
    loadChildren: () => import('@picsa/monitoring/src/app/app.module-embedded').then((mod) => mod.MonitoringToolModule),
  },
  {
    path: 'manual',
    loadChildren: () => import('@picsa/manual/src/app/app.module-embedded').then((mod) => mod.ManualToolModule),
  },
  {
    path: 'option',
    loadChildren: () => import('@picsa/option/src/app/app.module-embedded').then((mod) => mod.OptionsToolModule),
  },
  {
    path: 'resources',
    loadChildren: () => import('@picsa/resources/src/app/app.module-embedded').then((mod) => mod.ResourcesToolModule),
  },
  {
    path: '',
    loadChildren: () => import('./pages/home/home.module').then((mod) => mod.HomePageModule),
    title: 'PICSA',
  },
  {
    path: 'settings',
    loadChildren: () => import('./pages/settings/settings.module').then((mod) => mod.SettingsPageModule),
  },
  {
    path: 'discussions',
    loadChildren: () => import('./pages/discussions/discussions.module').then((mod) => mod.DiscussionsPageModule),
    title: 'Discussions',
  },

  {
    path: 'privacy',
    loadChildren: () => import('./pages/privacy/privacy.module').then((mod) => mod.PrivacyModule),
  },

  // { path: '**', redirectTo: '/home' }
  // NOTE - multiple 'catch-all' with sub apps causes issues
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    BudgetToolModule.forRoot({ urlPrefix: 'budget' }),
    ClimateToolModule.forRoot({ urlPrefix: 'climate' }),
    CropProbabilityToolModule.forRoot({ urlPrefix: 'crop-probability' }),
    ManualToolModule.forRoot({ urlPrefix: 'manual' }),
    MonitoringToolModule.forRoot({ urlPrefix: 'monitoring' }),
    OptionsToolModule.forRoot({ urlPrefix: 'option' }),
    ResourcesToolModule.forRoot({ urlPrefix: 'resources' }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
