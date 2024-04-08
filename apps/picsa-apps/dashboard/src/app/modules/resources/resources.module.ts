import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ResourceCollectionsComponent } from './pages/collections/resource-collections.component';
import { ResourceCreateComponent } from './pages/create/resource-create.component';
import { ResourceFilesComponent } from './pages/files/resource-files.component';
import { ResourceLinksComponent } from './pages/links/resource-links.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        redirectTo: 'collections',
        pathMatch: 'full',
      },
      {
        path: 'collections',
        component: ResourceCollectionsComponent,
      },
      {
        path: 'files',
        component: ResourceFilesComponent,
      },

      {
        path: 'links',
        component: ResourceLinksComponent,
      },

      {
        path: 'files/create',
        component: ResourceCreateComponent,
      },
      {
        path: 'files/:id',
        component: ResourceCreateComponent,
      },
    ]),
  ],
})
export class ResourcesPageModule {}
