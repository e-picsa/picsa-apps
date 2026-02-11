import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { authRoleGuard } from '../auth/guards/auth-role.guard';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        redirectTo: 'files',
        pathMatch: 'full',
      },
      {
        path: 'files',
        loadComponent: () => import('./pages/files/resource-files.component').then((m) => m.ResourceFilesComponent),
      },
      {
        path: 'files/create',
        loadComponent: () =>
          import('./pages/files/edit/resource-file-edit.component').then((m) => m.ResourceFileEditComponent),
        canActivate: [authRoleGuard('resources.admin')],
      },
      {
        path: 'files/:id',
        loadComponent: () =>
          import('./pages/files/edit/resource-file-edit.component').then((m) => m.ResourceFileEditComponent),
        canActivate: [authRoleGuard('resources.admin')],
      },
      {
        path: 'links',
        loadComponent: () => import('./pages/links/resource-links.component').then((m) => m.ResourceLinksComponent),
      },
      {
        path: 'links/create',
        loadComponent: () =>
          import('./pages/links/edit/resource-link-edit.component').then((m) => m.ResourceLinkEditComponent),
        canActivate: [authRoleGuard('resources.admin')],
      },
      {
        path: 'links/:id',
        loadComponent: () =>
          import('./pages/links/edit/resource-link-edit.component').then((m) => m.ResourceLinkEditComponent),
        canActivate: [authRoleGuard('resources.admin')],
      },
      {
        path: 'collections',
        loadComponent: () =>
          import('./pages/collections/resource-collections.component').then((m) => m.ResourceCollectionsComponent),
      },
      {
        path: 'collections/create',
        loadComponent: () =>
          import('./pages/collections/edit/resource-collection-edit.component').then(
            (m) => m.ResourceCollectionEditComponent,
          ),
        canActivate: [authRoleGuard('resources.admin')],
      },
      {
        path: 'collections/:id',
        loadComponent: () =>
          import('./pages/collections/edit/resource-collection-edit.component').then(
            (m) => m.ResourceCollectionEditComponent,
          ),
        canActivate: [authRoleGuard('resources.admin')],
      },
    ]),
  ],
})
export class ResourcesPageModule {}
