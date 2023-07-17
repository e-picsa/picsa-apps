/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ResourcesComponentsModule } from '@picsa/resources/src/app/components/components.module';
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
    ResourcesComponentsModule,
  ],
  exports: [],
  declarations: [HomeComponent],
  providers: [],
})
export class HomeModule {}
