import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n';
import { PicsaAnimationsModule } from '@picsa/shared/features';

import { ClimateToolComponentsModule } from '../../components/climate-tool-components.module';
import { ClimateSiteViewComponent } from './site-view.page';

const routes: Routes = [
  {
    path: '',
    component: ClimateSiteViewComponent,
  },
];

@NgModule({
  imports: [
    CommonModule,
    ClimateToolComponentsModule,
    RouterModule.forChild(routes),
    PicsaTranslateModule,
    FormsModule,
    PicsaAnimationsModule,
  ],
  declarations: [ClimateSiteViewComponent],
})
export class ClimateSiteViewPageModule {}
