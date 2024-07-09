import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ResourceCollectionsComponent } from './pages/collections/resource-collections.component';
import { ResourceFileEditComponent } from './pages/files/edit/resource-file-edit.component';
import { ResourceFilesComponent } from './pages/files/resource-files.component';
import { ResourceLinksComponent } from './pages/links/resource-links.component';

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
        component: ResourceFilesComponent,
      },
      {
        path: 'links',
        component: ResourceLinksComponent,
      },
      {
        path: 'collections',
        component: ResourceCollectionsComponent,
      },

      {
        path: 'files/create',
        component: ResourceFileEditComponent,
      },
      {
        path: 'files/:id',
        component: ResourceFileEditComponent,
      },
    ]),
  ],
})
export class ResourcesPageModule {}
