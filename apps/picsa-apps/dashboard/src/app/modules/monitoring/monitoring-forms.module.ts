import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        loadComponent: () => import('./pages/home/monitoring.page').then((m) => m.MonitoringPageComponent),
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./pages/update/update-monitoring-forms.component').then((m) => m.UpdateMonitoringFormsComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/view/view-monitoring-forms.component').then((m) => m.ViewMonitoringFormsComponent),
      },
      {
        path: ':id/submissions',
        loadComponent: () =>
          import('./pages/form-submissions/form-submissions.component').then((m) => m.FormSubmissionsComponent),
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./pages/update/update-monitoring-forms.component').then((m) => m.UpdateMonitoringFormsComponent),
      },
    ]),
  ],
})
export class MonitoringFormsPageModule {}
