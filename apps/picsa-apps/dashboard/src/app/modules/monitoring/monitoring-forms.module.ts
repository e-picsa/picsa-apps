import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { FormSubmissionsComponent } from './pages/form-submissions/form-submissions.component';
import { MonitoringPageComponent } from './pages/home/monitoring.page';
import { UpdateMonitoringFormsComponent } from './pages/update/update-monitoring-forms.component';
import { ViewMonitoringFormsComponent } from './pages/view/view-monitoring-forms.component';

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
        component: ViewMonitoringFormsComponent,
      },
      {
        path: ':id/submissions',
        component: FormSubmissionsComponent,
      },
      {
        path: ':id/update',
        component: UpdateMonitoringFormsComponent,
      }
    ]),
  ],
})
export class MonitoringFormsPageModule {}
