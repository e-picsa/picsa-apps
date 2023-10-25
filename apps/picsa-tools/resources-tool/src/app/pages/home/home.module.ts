import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { MobxAngularModule } from 'mobx-angular';

import { ResourcesComponentsModule } from '../../components/components.module';
import { HomeComponent } from './home.component';

const routes: Routes = [{ path: '', component: HomeComponent }];

@NgModule({
  declarations: [HomeComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    PicsaTranslateModule,
    PicsaCommonComponentsModule,
    ResourcesComponentsModule,
    MobxAngularModule,
  ],
})
export class HomeModule {}
