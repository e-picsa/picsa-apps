import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PicsaMapModule } from '@picsa/shared/features/map';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';

import { ClimateToolComponentsModule } from '../../components/climate-tool-components.module';
import { SiteSelectPage } from './site-select.page';

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
