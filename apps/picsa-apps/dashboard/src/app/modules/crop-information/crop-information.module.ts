import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { CropProbabilityComponent } from './pages/probability/probability.component';
import { CropVarietyComponent } from './pages/variety/variety.component';
import { VarietyDetailsComponent } from './pages/variety-details/variety-details.component';

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
        component: CropVarietyComponent,
      },
      {
        path: 'variety/:id',
        component: VarietyDetailsComponent,
      },
      {
        path: 'probability',
        component: CropProbabilityComponent,
      },
      // new entry
      // {
      //   path: 'entry',
      //   component: NewEntryPageComponent,
      // },
      // editable entry
    ]),
  ],
})
export class CropInformationModule {}
