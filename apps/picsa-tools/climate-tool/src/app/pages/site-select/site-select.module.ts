import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { PicsaMapModule } from '@picsa/shared/features/map';
import { SiteSelectPage } from './site-select.page';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';
import { ClimateToolComponentsModule } from '../../components/climate-tool-components.module';

const routes: Routes = [
  {
    path: '',
    component: SiteSelectPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    ClimateToolComponentsModule,
    RouterModule.forChild(routes),
    PicsaTranslateModule,
    PicsaMapModule,
  ],
  declarations: [SiteSelectPage],
})
export class ClimateSiteSelectPageModule {}
