import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home.component';
import { PicsaCommonComponentsModule } from '@picsa/components';
import { ResourcesComponentsModule } from '../../components/components.module';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { MobxAngularModule } from 'mobx-angular';

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
