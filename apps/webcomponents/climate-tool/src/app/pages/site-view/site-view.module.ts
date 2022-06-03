import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { ClimateSiteViewPage } from './site-view.page';
import { PicsaChartsModule } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';
import { ClimateToolComponentsModule } from '../../components/climate-tool-components.module';
import { ClimateMaterialModule } from '../../material.module';

const routes: Routes = [
  {
    path: '',
    component: ClimateSiteViewPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    ClimateToolComponentsModule,
    RouterModule.forChild(routes),
    PicsaTranslateModule,
    ClimateMaterialModule,
    PicsaChartsModule,
    FormsModule,
  ],
  declarations: [ClimateSiteViewPage],
})
export class ClimateSiteViewPageModule {}
