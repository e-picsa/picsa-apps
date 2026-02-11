import { defineFeature } from '../../utils/route-utils';

export const AdminFeature = defineFeature({
  rootPath: 'admin',
  navLabel: 'Admin',
  // Placeholder feature solely for redirecting
  routes: [
    {
      path: '',
      redirectTo: '/user-permissions',
      pathMatch: 'full',
    },
  ],
});

/**
 * The User Permissions page is conceptually a top-level feature within the Admin area,
 * so we export it as a separate feature to get a top-level NAV_LINK with the correct icon and label.
 * rootPath is 'admin/user-permissions' to generate the correct absolute href for the nav link.
 * Inside the routes, we define 'user-permissions' relative to the AdminModule's root ('admin').
 */
export const AdminUserPermissionsFeature = defineFeature({
  rootPath: 'admin/user-permissions',
  navLabel: 'User Permissions',
  matIcon: 'manage_accounts',
  roleRequired: 'deployments.admin',
  routes: [
    {
      path: 'user-permissions',
      loadComponent: () =>
        import('./pages/user-permissions/user-permissions.component').then((m) => m.AdminUserPermissionsComponent),
    },
  ],
});
