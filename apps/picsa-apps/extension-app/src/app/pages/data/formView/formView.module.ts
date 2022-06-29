import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { FormViewPage } from './formView.page';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';
import { ComponentsModule } from '../../../components/components.module';

const routes: Routes = [
  {
    path: '',
    component: FormViewPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    PicsaTranslateModule,
    ComponentsModule,
  ],
  declarations: [FormViewPage],
})
export class FormViewPageModule {}
