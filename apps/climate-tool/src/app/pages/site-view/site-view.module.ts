import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { ClimateSiteViewPage } from './site-view.page';
import { IonicModule } from '@ionic/angular';
import { PicsaChartsModule } from '@picsa/features';
import { ClimateToolComponentsModule } from '@picsa/climate/src/app/components/climate-tool-components.module';
import { PicsaTranslateModule } from '@picsa/modules';
import { ClimateMaterialModule } from '@picsa/climate/src/app/material.module';

const routes: Routes = [
  {
    path: '',
    component: ClimateSiteViewPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ClimateToolComponentsModule,
    PicsaChartsModule,
    PicsaTranslateModule,
    ClimateMaterialModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ClimateSiteViewPage]
})
export class ClimateSiteViewPageModule {}
