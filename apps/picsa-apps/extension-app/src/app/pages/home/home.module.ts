import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';
import { MobxAngularModule } from 'mobx-angular';

import { ComponentsModule } from '../../components/components.module';
import { ExtensionToolkitMaterialModule } from '../../material.module';
import { HomePage } from './home.page';

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
