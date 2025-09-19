import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        redirectTo: 'variety',
        pathMatch: 'full',
      },
      {
        path: 'admin',
        loadComponent: () => import('./pages/admin/admin.component').then((m) => m.DashboardCropAdminComponent),
      },
      {
        path: 'variety',
        loadComponent: () => import('./pages/variety/variety.component').then((m) => m.CropVarietyComponent),
      },
      {
        path: 'variety/:id',
        loadComponent: () =>
          import('./pages/variety/details/variety-details.component').then((m) => m.CropVarietyDetailsComponent),
      },
      {
        path: 'probability',
        loadComponent: () =>
          import('./pages/probability/probability.component').then((m) => m.CropProbabilityComponent),
      },
      {
        path: 'probability/:locationId',
        loadComponent: () =>
          import('./pages/probability/downscaled/probability-downscaled.component').then(
            (m) => m.ProbabilityDownscaledComponent,
          ),
      },
    ]),
  ],
})
export class CropInformationModule {}
