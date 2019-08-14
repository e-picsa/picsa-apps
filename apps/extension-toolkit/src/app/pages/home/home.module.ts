import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { HomePage } from './home.page';
import { ComponentsModule } from '@picsa/extension/src/app/components/components.module';
import { PicsaTranslateModule } from '@picsa/modules';
import { ExtensionToolkitMaterialModule } from '@picsa/extension/src/app/material.module';

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
    IonicModule,
    RouterModule.forChild(routes),
    ComponentsModule,
    ExtensionToolkitMaterialModule,
    PicsaTranslateModule
  ],
  declarations: [HomePage]
})
export class HomePageModule {}
