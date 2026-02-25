import { Type as ComponentType } from '@angular/core';
import type { AppRole } from '@picsa/server-types';

export type HomeOverviewComponent = {
  label: string;
  href: string;
  roleRequired?: AppRole;
  load: () => Promise<ComponentType<unknown>>;
};

export const HOME_OVERVIEW_COMPONENTS: HomeOverviewComponent[] = [
  {
    label: 'Users',
    href: '/deployment/permissions',
    roleRequired: 'deployments.admin',
    load: () =>
      import('../deployment/components/admin-overview/admin-overview.component').then(
        (m) => m.DeploymentAdminSummaryComponent,
      ),
  },
];
