import { Route, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { PicsaTranslateModule } from '@picsa/shared/modules';

import { HomeComponent } from './home.component';
import { OptionToolComponentsModule } from '../../components/components.module';

const routes: Route[] = [
  {
    path: '',
    component: HomeComponent,
  },
];

@NgModule({
  declarations: [HomeComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    OptionToolComponentsModule,
    PicsaTranslateModule,
  ],
})
export class HomeModule {}
