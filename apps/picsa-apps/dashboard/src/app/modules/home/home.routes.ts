import { defineFeature } from '../../utils/route-utils';

export const HomeFeature = defineFeature({
  path: 'home',
  nav: {
    label: 'Home',
    icon: 'home',
  },
  loadComponent: () => import('./home.component').then((m) => m.DashboardHomeComponent),
});
