import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MonitoringPageComponent } from './pages/home/monitoring.page';
import { NewMonitoringFormsComponent } from './pages/new/new-monitoring-forms.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: MonitoringPageComponent,
      },
      {
        path: ':id',
        component: NewMonitoringFormsComponent,
      }
    ]),
  ],
})
export class MonitoringPageModule {}
