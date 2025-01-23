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
        path: 'variety',
        loadComponent: () => import('./pages/variety/variety.component').then((m) => m.CropVarietyComponent),
      },
      {
        path: 'variety/:id',
        loadComponent: () =>
          import('./pages/variety-details/variety-details.component').then((m) => m.CropVarietyDetailsComponent),
      },
      {
        path: 'probability',
        loadComponent: () =>
          import('./pages/probability/probability.component').then((m) => m.CropProbabilityComponent),
      },
    ]),
  ],
})
export class CropInformationModule {}
