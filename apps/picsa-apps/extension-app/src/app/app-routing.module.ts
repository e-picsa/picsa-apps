/* eslint-disable @nx/enforce-module-boundaries */
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BudgetToolModule } from '@picsa/budget/src/app/app.module-embedded';
import { ClimateToolModule } from '@picsa/climate/src/app/app.module-embedded';
import { CropProbabilityToolModule } from '@picsa/crop-probability/src/app/app.module-embedded';
import { appRoutes as extensionContentRoutes } from '@picsa/extension-content/src/app/app.routes';
import { FarmerActivityModule } from '@picsa/farmer-activity/src/app/app.module-embedded';
import { appRoutes as farmerContentRoutes } from '@picsa/farmer-content/src/app/app.routes';
import { ManualToolModule } from '@picsa/manual/src/app/app.module-embedded';
import { MonitoringToolModule } from '@picsa/monitoring/src/app/app.module-embedded';
import { OptionsToolModule } from '@picsa/option/src/app/app.module-embedded';
import { ResourcesToolModule } from '@picsa/resources/src/app/app.module-embedded';
import { SeasonalCalendarToolModule } from '@picsa/seasonal-calendar/src/app/app.module-embedded';

const routes: Routes = [
  // Updated syntax for standalone components (other routes could be migrated in similar way)
  // Import farmer-content routes which lazy-load on /farmer endpoint
  // Use component-less top route to enforce route guard on all child routes
  {
    path: 'farmer',
    canActivate: [],
    children: farmerContentRoutes,
    title: 'PICSA',
  },
  {
    path: 'extension',
    canActivate: [],
    children: extensionContentRoutes,
    title: 'PICSA',
  },

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
    path: 'farmer-activity',
    loadChildren: () =>
      import('@picsa/farmer-activity/src/app/app.module-embedded').then((mod) => mod.FarmerActivityModule),
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
    path: 'seasonal-calendar',
    loadChildren: () =>
      import('@picsa/seasonal-calendar/src/app/app.module-embedded').then((mod) => mod.SeasonalCalendarToolModule),
  },
  {
    path: 'photos',
    loadComponent: () => import('@picsa/shared/features/photo').then((mod) => mod.PicsaPhotoListComponent),
  },
  // NOTE - Home not currently working as standalone component so keeping as module
  // (possibly needs to import router-outlet or similar for setup)
  {
    path: '',
    loadChildren: () => import('./pages/home/home.module').then((mod) => mod.HomePageModule),
    title: 'PICSA',
  },

  {
    path: 'privacy',
    loadChildren: () => import('./pages/privacy/privacy.module').then((mod) => mod.PrivacyModule),
  },
  {
    path: 'error',
    loadChildren: () => import('./pages/error/error.module').then((mod) => mod.ErrorPageModule),
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
    SeasonalCalendarToolModule.forRoot({ urlPrefix: 'seasonal-calendar' }),
    // NOTE - the farmer-activity module should be registered last to reuse routes from other tools
    FarmerActivityModule.forRoot({ urlPrefix: 'farmer-activity' }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
