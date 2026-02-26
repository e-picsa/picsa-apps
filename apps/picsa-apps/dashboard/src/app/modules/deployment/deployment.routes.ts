import { defineFeature } from '../../utils/route-utils';

const DeploymentFeature = defineFeature({
  path: 'deployment',
  nav: {
    label: 'Deployments',
    icon: 'apps',
  },
  roleRequired: 'deployments.admin',

  children: [
    {
      path: '',
      pathMatch: 'full',
      loadComponent: () => import('./pages/list/deployment-list.component').then((m) => m.DeploymentListComponent),
      roleRequired: 'deployments.admin',
    },
    {
      path: 'permissions',
      nav: { hidden: true },
      loadComponent: () =>
        import('./pages/user-permissions/user-permissions.component').then((m) => m.DeploymentUserPermissionsComponent),
      roleRequired: 'deployments.admin',
    },
  ],
});

// HACK - show /deployment/permissions as standalone nav link, not nested
DeploymentFeature.NAV_LINKS.push({
  href: '/deployment/permissions',
  label: 'User Permissions',
  roleRequired: 'deployments.admin',
  matIcon: 'manage_accounts',
});

export { DeploymentFeature };
