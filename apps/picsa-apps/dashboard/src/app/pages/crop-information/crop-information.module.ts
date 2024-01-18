import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { CropInformationPageComponent } from './crop-information.page';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: CropInformationPageComponent,
      },
    ]),
  ],
})
export class CropInformationModule {}
