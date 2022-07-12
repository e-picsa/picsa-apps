import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { ResourcesMaterialModule } from '../material.module';

import { ResourceListComponent } from './resource-list/resource-list.component';
import { ResourceItemComponent } from './resource-item/resource-item.component';
import { ResourceGroupComponent } from './resource-group/resource-group.component';
import { RouterModule } from '@angular/router';

const components = [
  ResourceListComponent,
  ResourceItemComponent,
  ResourceGroupComponent,
];

@NgModule({
  imports: [
    CommonModule,
    PicsaTranslateModule,
    ResourcesMaterialModule,
    RouterModule,
  ],
  exports: components,
  declarations: components,
  providers: [],
})
export class ResourcesComponentsModule {}
