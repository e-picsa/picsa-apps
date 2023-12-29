import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { CropProbabilityToolComponentsModule } from '../../components/components.module';
import { HomeComponent } from './home.component';
import { PicsaTourButton } from '@picsa/components/src';

const routes: Route[] = [
  {
    path: '',
    component: HomeComponent,
  },
];

@NgModule({
  imports: [
    CommonModule,
    CropProbabilityToolComponentsModule,
    RouterModule.forChild(routes),
    PicsaTranslateModule,
    PicsaTourButton,
  ],
  exports: [],
  declarations: [HomeComponent],
  providers: [],
})
export class HomeModule {}
