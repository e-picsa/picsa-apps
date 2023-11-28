import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

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
    ]),
  ],
})
export class ResourcesPageModule {}
