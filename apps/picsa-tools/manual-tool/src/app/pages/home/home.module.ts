/* eslint-disable @nx/enforce-module-boundaries */
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ResourceItemFileComponent } from '@picsa/resources/components';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { ManualToolComponentsModule } from '../../components/components.module';
import { HomeComponent } from './home.component';

const routes: Route[] = [
  {
    path: '',
    component: HomeComponent,
  },
];

@NgModule({
  imports: [
    CommonModule,
    ManualToolComponentsModule,
    RouterModule.forChild(routes),
    PicsaTranslateModule,
    ResourceItemFileComponent,
  ],
  exports: [],
  declarations: [HomeComponent],
  providers: [],
})
export class HomeModule {}
