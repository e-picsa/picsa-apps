import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { CropFeature } from './crop.routes';

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(CropFeature.ROUTES)],
})
export class CropInformationModule {}
