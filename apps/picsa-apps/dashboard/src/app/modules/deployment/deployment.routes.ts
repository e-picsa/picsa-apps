import { defineFeature } from '../../utils/route-utils';

export const DeploymentFeature = defineFeature({
  path: 'deployment',
  nav: {
    label: 'Deployments',
    icon: 'apps',
  },
  roleRequired: 'deployments.admin',
  loadComponent: () => import('./pages/list/deployment-list.component').then((m) => m.DeploymentListComponent),
});
