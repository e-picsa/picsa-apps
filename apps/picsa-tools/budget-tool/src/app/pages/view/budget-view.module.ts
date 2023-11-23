import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { PicsaCommonComponentsModule } from '@picsa/components/src';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';
import { MobxAngularModule } from 'mobx-angular';

import { BudgetToolComponentsModule } from '../../components/budget-tool.components';
import { BudgetMaterialModule } from '../../material.module';
import { BudgetViewPage } from './budget-view.page';

const routes: Routes = [
  {
    path: '',
    component: BudgetViewPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    PicsaCommonComponentsModule,
    PicsaTranslateModule,
    BudgetMaterialModule,
    BudgetToolComponentsModule,
    MobxAngularModule,
  ],
  declarations: [BudgetViewPage],
})
export class BudgetViewPageModule {}
