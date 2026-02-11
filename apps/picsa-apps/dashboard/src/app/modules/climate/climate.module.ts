import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ClimateFeature } from './climate.routes';

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(ClimateFeature.ROUTES)],
})
export class ClimateModule {}
