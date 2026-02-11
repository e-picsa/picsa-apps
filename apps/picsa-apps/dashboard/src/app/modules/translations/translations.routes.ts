import { defineFeature } from '../../utils/route-utils';

export const TranslationsFeature = defineFeature({
  path: 'translations',
  nav: {
    label: 'Translations',
    icon: 'translate',
  },
  children: [
    {
      path: '',
      redirectTo: 'list',
      pathMatch: 'full',
    },
    {
      path: 'list',
      loadComponent: () => import('./pages/home/translations.page').then((m) => m.TranslationsPageComponent),
    },
    {
      path: 'import',
      loadComponent: () =>
        import('./pages/import/translations-import.component').then((mod) => mod.TranslationsImportComponent),
      roleRequired: 'translations.admin',
    },
    {
      path: 'edit/:id',
      loadComponent: () => import('./pages/edit/translations-edit.component').then((m) => m.TranslationsEditComponent),
    },
  ],
});
