import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

// import { EnketoWebform } from '@picsa/webcomponents-ngx/src/lib/generated/components';
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
        path: 'create',
        component: UpdateMonitoringFormsComponent,
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
        path: ':id/edit',
        component: UpdateMonitoringFormsComponent,
      },
    ]),
  ],
  // exports:[EnketoWebform]
})
export class MonitoringFormsPageModule {}
