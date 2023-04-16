import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule,Routes } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';
import { MobxAngularModule } from 'mobx-angular';

import { BudgetToolComponentsModule } from '../../components/budget-tool.components';
import { BudgetMaterialModule } from '../../material.module';
import { BudgetCreatePage } from './budget-create.page';

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
