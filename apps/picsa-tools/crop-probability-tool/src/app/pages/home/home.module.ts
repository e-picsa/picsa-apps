import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

import { CropProbabilityToolComponentsModule } from '../../components/components.module';
import { HomeComponent } from './home.component';
import { CommonModule } from '@angular/common';
import { PicsaTranslateModule } from '@picsa/shared/modules';

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
  ],
  exports: [],
  declarations: [HomeComponent],
  providers: [],
})
export class HomeModule {}
