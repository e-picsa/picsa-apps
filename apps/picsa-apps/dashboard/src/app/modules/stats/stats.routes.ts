import { defineFeature } from '../../utils/route-utils';

export const StatsFeature = defineFeature({
  path: 'stats',
  nav: {
    label: 'Statistics',
    icon: 'query_stats',
  },
  loadComponent: () => import('./stats.component').then((m) => m.DashboardStatsComponent),
});
