import { defineFeature } from '../../utils/route-utils';

export const MonitoringFeature = defineFeature({
  rootPath: 'monitoring',
  navLabel: 'Monitoring',
  matIcon: 'poll',
  roleRequired: 'monitoring.admin',
  routes: [
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
  ],
});
