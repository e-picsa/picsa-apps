import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { MobxAngularModule } from 'mobx-angular';

import { ResourcesComponentsModule } from '../../components/components.module';
import { HomeComponent } from './home.component';
import { HomeRoutingModule } from './home-routing.module';

@NgModule({
  declarations: [HomeComponent],
  imports: [
    CommonModule,
    HomeRoutingModule,
    PicsaTranslateModule,
    PicsaCommonComponentsModule,
    ResourcesComponentsModule,
    MobxAngularModule,
  ],
})
export class HomeModule {}
