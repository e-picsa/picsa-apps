import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PicsaVideoPlayerModule } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { ResourcesMaterialModule } from '../material.module';
import { ResourceDownloadComponent } from './resource-download/resource-download.component';
import { ResourceItemComponent } from './resource-item/resource-item.component';
import {
  ResourceItemCardComponent,
  ResourceItemCollectionComponent,
  ResourceItemVideoComponent,
} from './resource-item/templates';

const components = [
  ResourceDownloadComponent,
  ResourceItemComponent,
  ResourceItemCardComponent,
  ResourceItemCollectionComponent,
  ResourceItemVideoComponent,
];

@NgModule({
  imports: [CommonModule, PicsaTranslateModule, PicsaVideoPlayerModule, ResourcesMaterialModule, RouterModule],
  exports: [...components, ResourcesMaterialModule, PicsaTranslateModule],
  declarations: components,
  providers: [],
})
export class ResourcesComponentsModule {}
