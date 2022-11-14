import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { ClimateSiteViewComponent } from './site-view.page';
import {
  PicsaChartsModule,
  PicsaAnimationsModule,
} from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';
import { ClimateToolComponentsModule } from '../../components/climate-tool-components.module';

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
    PicsaChartsModule,
    FormsModule,
    PicsaAnimationsModule,
  ],
  declarations: [ClimateSiteViewComponent],
})
export class ClimateSiteViewPageModule {}
