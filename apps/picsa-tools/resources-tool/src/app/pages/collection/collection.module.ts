import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { ResourcesComponentsModule } from '../../components/components.module';
import { ResourcesMaterialModule } from '../../material.module';
import { CollectionComponent } from './collection.component';
import { CollectionRoutingModule } from './collection-routing.module';

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
