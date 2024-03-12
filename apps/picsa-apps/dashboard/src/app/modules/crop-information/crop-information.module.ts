import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { CropInformationPageComponent } from './crop-information.page';
import { NewEntryPageComponent } from './pages/new_entry/new_entry.page';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: CropInformationPageComponent,
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
