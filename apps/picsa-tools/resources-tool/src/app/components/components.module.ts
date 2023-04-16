import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { ResourcesMaterialModule } from '../material.module';
import { ResourceItemComponent } from './resource-item/resource-item.component';

const components = [ResourceItemComponent];

@NgModule({
  imports: [CommonModule, PicsaTranslateModule, ResourcesMaterialModule, RouterModule],
  exports: components,
  declarations: components,
  providers: [],
})
export class ResourcesComponentsModule {}
