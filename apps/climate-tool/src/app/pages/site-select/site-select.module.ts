import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { PicsaMapModule } from '@picsa/features/map';
import { SiteSelectPage } from './site-select.page';
import { PicsaTranslateModule } from '@picsa/modules';
import { ClimateMaterialModule } from 'src/app/material.module';

const routes: Routes = [
  {
    path: '',
    component: SiteSelectPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    PicsaMapModule,
    RouterModule.forChild(routes),
    PicsaTranslateModule.forChild(),
    ClimateMaterialModule
  ],
  declarations: [SiteSelectPage]
})
export class ClimateSiteSelectPageModule {}
