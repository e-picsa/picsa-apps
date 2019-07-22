import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { ClimateViewPage } from './climate-view.page';
import { IonicModule } from '@ionic/angular';
import { PicsaChartsModule } from '@picsa/features';
import { ClimateToolComponentsModule } from 'src/app/components/climate-tool-components.module';
import { PicsaTranslateModule } from '@picsa/modules';
import { PicsaMaterialModule } from 'src/app/material.module';

const routes: Routes = [
  {
    path: '',
    component: ClimateViewPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ClimateToolComponentsModule,
    PicsaChartsModule,
    PicsaTranslateModule.forChild(),
    PicsaMaterialModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ClimateViewPage]
})
export class ClimateViewPageModule {}
