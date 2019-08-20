import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { HomePage } from './home.page';
import { ComponentsModule } from '@picsa/extension/src/app/components/components.module';
import { ExtensionToolkitMaterialModule } from '@picsa/extension/src/app/material.module';
import { MobxAngularModule } from 'mobx-angular';
import { PicsaTranslateModule } from '@picsa/modules';

const routes: Routes = [
  {
    path: '',
    component: HomePage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MobxAngularModule,
    RouterModule.forChild(routes),
    ComponentsModule,
    ExtensionToolkitMaterialModule,
    PicsaTranslateModule
  ],
  declarations: [HomePage]
})
export class HomePageModule {}
