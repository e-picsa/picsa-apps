import { defineFeature } from '../../utils/route-utils';

export const CropFeature = defineFeature({
  path: 'crop',
  nav: {
    label: 'Crop',
    icon: 'spa',
  },
  children: [
    {
      path: '',
      redirectTo: 'variety',
      pathMatch: 'full',
    },
    {
      path: 'variety',
      nav: { label: 'Variety' },
      loadComponent: () => import('./pages/variety/variety.component').then((m) => m.CropVarietyComponent),
    },
    {
      path: 'variety/add',
      nav: { hidden: true },
      loadComponent: () =>
        import('./pages/variety/details/variety-details.component').then((m) => m.CropVarietyDetailsComponent),
      roleRequired: 'crop.admin',
    },
    {
      path: 'variety/:id',
      loadComponent: () =>
        import('./pages/variety/details/variety-details.component').then((m) => m.CropVarietyDetailsComponent),
    },
    {
      path: 'probability',
      nav: { label: 'Probability' },
      loadComponent: () => import('./pages/probability/probability.component').then((m) => m.CropProbabilityComponent),
    },
    {
      path: 'probability/:locationId',
      loadComponent: () =>
        import('./pages/probability/downscaled/probability-downscaled.component').then(
          (m) => m.ProbabilityDownscaledComponent,
        ),
    },
    {
      path: 'admin',
      loadComponent: () => import('./pages/admin/admin.component').then((m) => m.DashboardCropAdminComponent),
      roleRequired: 'crop.admin',
    },
  ],
});
