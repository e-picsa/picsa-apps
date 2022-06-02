import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

import { BudgetCreatePage } from './budget-create.page';
import { BudgetMaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MobxAngularModule } from 'mobx-angular';
import { BudgetToolComponentsModule } from '../../components/budget-tool.components';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';

const routes: Routes = [
  {
    path: '',
    component: BudgetCreatePage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    BudgetMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    MobxAngularModule,
    BudgetToolComponentsModule,
    PicsaTranslateModule,
  ],
  declarations: [BudgetCreatePage],
})
export class BudgetCreatePageModule {}
