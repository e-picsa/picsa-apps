import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PicsaVideoPlayerModule } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { SizeMBPipe } from '@picsa/shared/pipes/sizeMB';

import { ResourcesMaterialModule } from '../material.module';
import { ResourceDownloadComponent } from './resource-download/resource-download.component';
import { ResourceDownloadMultipleComponent } from './resource-download-multiple/resource-download-multiple.component';
import {
  ResourceItemCollectionComponent,
  ResourceItemFileComponent,
  ResourceItemLinkComponent,
  ResourceItemVideoComponent,
} from './resource-item';
import { ResourceShareComponent } from './resource-share/resource-share.component';

const components = [
  ResourceDownloadComponent,
  ResourceShareComponent,
  ResourceItemCollectionComponent,
  ResourceItemFileComponent,
  ResourceItemLinkComponent,
  ResourceItemVideoComponent,
  ResourceDownloadMultipleComponent,
];

@NgModule({
  imports: [
    CommonModule,
    PicsaTranslateModule,
    PicsaVideoPlayerModule,
    ResourcesMaterialModule,
    RouterModule,
    SizeMBPipe,
  ],
  exports: [...components, ResourcesMaterialModule, PicsaTranslateModule, SizeMBPipe],
  declarations: components,
  providers: [],
})
export class ResourcesComponentsModule {}
