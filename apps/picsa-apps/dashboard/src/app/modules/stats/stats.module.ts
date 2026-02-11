import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { StatsFeature } from './stats.routes';
@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(StatsFeature.ROUTES)],
})
export class StatsModule {}
