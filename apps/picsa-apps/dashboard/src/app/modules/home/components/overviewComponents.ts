import { Type as ComponentType } from '@angular/core';
import type { AppRole } from '@picsa/server-types';

export type HomeOverviewComponent = {
  label: string;
  href: string;
  roleRequired?: AppRole;
  inputs?: Record<string, any>;
  load: () => Promise<ComponentType<unknown>>;
};

/**
 * Components display as part of home page summary
 */
export const HOME_ADMIN_COMPONENTS: HomeOverviewComponent[] = [
  // Custom admin
  {
    label: 'Permission Requests',
    href: '/deployment/permissions',
    roleRequired: 'deployments.admin',
    load: () =>
      import('../../deployment/components/admin-overview/admin-overview.component').then(
        (m) => m.DeploymentAdminSummaryComponent,
      ),
  },
];
