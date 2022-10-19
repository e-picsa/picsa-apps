import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { BudgetHomePage } from './budget-home.page';
import { BudgetToolComponentsModule } from '../../components/budget-tool.components';
import { BudgetMaterialModule } from '../../material.module';
import { MobxAngularModule } from 'mobx-angular';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';
import { PicsaDialogsModule } from '@picsa/shared/features';
import { FormsModule } from '@angular/forms';

const routes: Routes = [
  {
    path: '',
    component: BudgetHomePage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    PicsaTranslateModule,
    PicsaDialogsModule,
    BudgetMaterialModule,
    BudgetToolComponentsModule,
    MobxAngularModule,
  ],
  declarations: [BudgetHomePage],
})
export class BudgetHomePageModule {}
