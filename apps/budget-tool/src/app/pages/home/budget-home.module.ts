import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { BudgetHomePage } from './budget-home.page';
import { BudgetToolComponentsModule } from '../../components/budget-tool.components';
import { BudgetMaterialModule } from '../../material.module';
import { MobxAngularModule } from 'mobx-angular';
import { PicsaTranslateModule } from '@picsa/modules';
import { PicsaDialogsModule } from '@picsa/features';

const routes: Routes = [
  {
    path: '',
    component: BudgetHomePage
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    PicsaTranslateModule,
    PicsaDialogsModule,
    BudgetMaterialModule,
    BudgetToolComponentsModule,
    MobxAngularModule
  ],
  declarations: [BudgetHomePage]
})
export class BudgetHomePageModule {}
