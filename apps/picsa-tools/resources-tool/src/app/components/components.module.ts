import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PicsaVideoPlayerModule } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { ResourcesMaterialModule } from '../material.module';
import { ResourceDownloadComponent } from './resource-download/resource-download.component';
import {
  ResourceItemCollectionComponent,
  ResourceItemFileComponent,
  ResourceItemLinkComponent,
  ResourceItemVideoComponent,
} from './resource-item';

const components = [
  ResourceDownloadComponent,
  ResourceItemCollectionComponent,
  ResourceItemFileComponent,
  ResourceItemLinkComponent,
  ResourceItemVideoComponent,
];

@NgModule({
  imports: [CommonModule, PicsaTranslateModule, PicsaVideoPlayerModule, ResourcesMaterialModule, RouterModule],
  exports: [...components, ResourcesMaterialModule, PicsaTranslateModule],
  declarations: components,
  providers: [],
})
export class ResourcesComponentsModule {}
