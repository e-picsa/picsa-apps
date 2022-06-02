import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { DiscussionsPage } from './discussions.page';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';
import { ComponentsModule } from '../../components/components.module';
import { PicsaCommonComponentsModule } from '@picsa/shared/components';

const routes: Routes = [
  {
    path: '',
    component: DiscussionsPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ComponentsModule,
    RouterModule.forChild(routes),
    PicsaTranslateModule,
    PicsaCommonComponentsModule,
  ],
  declarations: [DiscussionsPage],
})
export class DiscussionsPageModule {}
