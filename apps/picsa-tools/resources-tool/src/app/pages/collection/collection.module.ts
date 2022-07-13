import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CollectionRoutingModule } from './collection-routing.module';
import { CollectionComponent } from './collection.component';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { PicsaCommonComponentsModule } from '@picsa/components';
import { ResourcesComponentsModule } from '../../components/components.module';
import { ResourcesMaterialModule } from '../../material.module';

@NgModule({
  declarations: [CollectionComponent],
  imports: [
    CommonModule,
    CollectionRoutingModule,
    PicsaTranslateModule,
    PicsaCommonComponentsModule,
    ResourcesComponentsModule,
    ResourcesMaterialModule,
  ],
})
export class CollectionModule {}
