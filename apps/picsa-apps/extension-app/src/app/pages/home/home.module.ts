import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';
import { MobxAngularModule } from 'mobx-angular';

import { HomePageComponent } from './home.page';

const routes: Routes = [
  {
    path: '',
    component: HomePageComponent,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MobxAngularModule,
    RouterModule.forChild(routes),
    PicsaTranslateModule,
    PicsaCommonComponentsModule,
    HomePageComponent,
  ],
})
export class HomePageModule {}
