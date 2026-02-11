import { defineFeature } from '../../utils/route-utils';

export const MonitoringFeature = defineFeature({
  path: 'monitoring',
  nav: {
    label: 'Monitoring',
    icon: 'poll',
  },
  roleRequired: 'monitoring.admin',
  loadComponent: () => import('./pages/home/monitoring.page').then((m) => m.MonitoringPageComponent),
  children: [
    {
      path: 'create',
      loadComponent: () =>
        import('./pages/update/update-monitoring-forms.component').then((m) => m.UpdateMonitoringFormsComponent),
      nav: { hidden: true },
    },
    {
      path: ':id',
      loadComponent: () =>
        import('./pages/view/view-monitoring-forms.component').then((m) => m.ViewMonitoringFormsComponent),
      children: [
        {
          path: 'submissions',
          loadComponent: () =>
            import('./pages/form-submissions/form-submissions.component').then((m) => m.FormSubmissionsComponent),
        },
        {
          path: 'edit',
          loadComponent: () =>
            import('./pages/update/update-monitoring-forms.component').then((m) => m.UpdateMonitoringFormsComponent),
        },
      ],
    },
  ],
});
