import { defineFeature } from '../../utils/route-utils';

export const ResourcesFeature = defineFeature({
  path: 'resources',
  nav: {
    label: 'Resources',
    icon: 'library_books',
  },
  children: [
    {
      path: '',
      redirectTo: 'files',
      pathMatch: 'full',
    },
    {
      path: 'files',
      nav: { label: 'Files' },
      loadComponent: () => import('./pages/files/resource-files.component').then((m) => m.ResourceFilesComponent),
    },
    {
      path: 'files/create',
      loadComponent: () =>
        import('./pages/files/edit/resource-file-edit.component').then((m) => m.ResourceFileEditComponent),
      roleRequired: 'resources.admin',
    },
    {
      path: 'files/:id',
      loadComponent: () =>
        import('./pages/files/edit/resource-file-edit.component').then((m) => m.ResourceFileEditComponent),
      roleRequired: 'resources.admin',
    },
    {
      path: 'links',
      nav: { label: 'Links' },
      loadComponent: () => import('./pages/links/resource-links.component').then((m) => m.ResourceLinksComponent),
    },
    {
      path: 'links/create',
      loadComponent: () =>
        import('./pages/links/edit/resource-link-edit.component').then((m) => m.ResourceLinkEditComponent),
      roleRequired: 'resources.admin',
    },
    {
      path: 'links/:id',
      loadComponent: () =>
        import('./pages/links/edit/resource-link-edit.component').then((m) => m.ResourceLinkEditComponent),
      roleRequired: 'resources.admin',
    },
    {
      path: 'collections',
      nav: { label: 'Collections' },
      loadComponent: () =>
        import('./pages/collections/resource-collections.component').then((m) => m.ResourceCollectionsComponent),
    },
    {
      path: 'collections/create',
      loadComponent: () =>
        import('./pages/collections/edit/resource-collection-edit.component').then(
          (m) => m.ResourceCollectionEditComponent,
        ),
      roleRequired: 'resources.admin',
    },
    {
      path: 'collections/:id',
      loadComponent: () =>
        import('./pages/collections/edit/resource-collection-edit.component').then(
          (m) => m.ResourceCollectionEditComponent,
        ),
      roleRequired: 'resources.admin',
    },
  ],
});
