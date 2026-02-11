import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MonitoringFeature } from './monitoring.routes';

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(MonitoringFeature.ROUTES)],
})
export class MonitoringFormsPageModule {}
