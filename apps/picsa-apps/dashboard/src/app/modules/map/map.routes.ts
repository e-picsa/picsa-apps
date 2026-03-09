import { defineFeature } from '../../utils/route-utils';

export const MapFeature = defineFeature({
  path: 'map-admin',
  nav: {
    label: 'Map Boundaries',
    icon: 'map',
  },
  roleRequired: 'app.admin',
  loadComponent: () => import('./pages/map-home/map-home.component').then((m) => m.MapHomeComponent),
});
