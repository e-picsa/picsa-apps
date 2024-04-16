import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { NewEntryPageComponent } from './pages/new_entry/new_entry.page';
import { CropVarietyComponent } from './pages/variety/variety.component';

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
      // new entry
      {
        path: 'entry',
        component: NewEntryPageComponent,
      },
      // editable entry
      {
        path: ':id',
        component: NewEntryPageComponent,
      },
    ]),
  ],
})
export class CropInformationModule {}
