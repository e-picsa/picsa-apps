import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ResourceCreateComponent } from './create/resource-create.component';
import { ResourcesPageComponent } from './resources.page';

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
    ]),
  ],
})
export class ResourcesPageModule {}
