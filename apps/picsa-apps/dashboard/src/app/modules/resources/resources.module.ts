import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ResourceCreateComponent } from './pages/create/resource-create.component';
import { ResourcesPageComponent } from './pages/home/resources.page';



@NgModule({
  declarations: [],
  imports: [
  CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: ResourcesPageComponent,
      },
      {
        path: 'create',
        component: ResourceCreateComponent,
      },
      {
        path: ':id',
        component: ResourceCreateComponent,
      }
    ]),
  ],
})
export class ResourcesPageModule {}
