import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { PicsaMapModule } from '@picsa/features/map';
import { SiteSelectPage } from './site-select.page';
import { PicsaMaterialModule, PicsaTranslateModule } from '@picsa/modules';

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
    PicsaMaterialModule
  ],
  declarations: [SiteSelectPage]
})
export class ClimateSiteSelectPageModule {}
