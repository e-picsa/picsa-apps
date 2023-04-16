import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';

import { ComponentsModule } from '../../components/components.module';
import { DiscussionsPage } from './discussions.page';

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
