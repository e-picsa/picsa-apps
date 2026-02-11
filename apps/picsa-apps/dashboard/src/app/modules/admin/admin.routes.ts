import { defineFeature } from '../../utils/route-utils';

export const AdminFeature = defineFeature({
  path: 'admin',
  nav: {
    label: 'Admin',
  },
  children: [
    {
      path: '',
      redirectTo: 'user-permissions',
      pathMatch: 'full',
    },
    {
      path: 'user-permissions',
      nav: {
        label: 'User Permissions',
        icon: 'manage_accounts',
        hoisted: true,
      },
      roleRequired: 'deployments.admin',
      loadComponent: () =>
        import('./pages/user-permissions/user-permissions.component').then((m) => m.AdminUserPermissionsComponent),
    },
  ],
});
