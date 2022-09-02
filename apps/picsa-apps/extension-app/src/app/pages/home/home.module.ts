import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { HomePage } from './home.page';
import { MobxAngularModule } from 'mobx-angular';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';
import { ComponentsModule } from '../../components/components.module';
import { ExtensionToolkitMaterialModule } from '../../material.module';
import { PicsaCommonComponentsModule } from '@picsa/components';

const routes: Routes = [
  {
    path: '',
    component: HomePage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MobxAngularModule,
    RouterModule.forChild(routes),
    ComponentsModule,
    ExtensionToolkitMaterialModule,
    PicsaTranslateModule,
    PicsaCommonComponentsModule,
  ],
  declarations: [HomePage],
})
export class HomePageModule {}
