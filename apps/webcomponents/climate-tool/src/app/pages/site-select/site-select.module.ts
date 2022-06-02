import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { PicsaMapModule } from '@picsa/features/map';
import { SiteSelectPage } from './site-select.page';
import { PicsaTranslateModule } from '@picsa/modules/translate';
import { ClimateMaterialModule } from '@picsa/climate/src/app/material.module';
import { ClimateToolComponentsModule } from '../../components/climate-tool-components.module';

const routes: Routes = [
  {
    path: '',
    component: SiteSelectPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    ClimateToolComponentsModule,
    RouterModule.forChild(routes),
    PicsaTranslateModule,
    ClimateMaterialModule,
    PicsaMapModule
  ],
  declarations: [SiteSelectPage]
})
export class ClimateSiteSelectPageModule {}
