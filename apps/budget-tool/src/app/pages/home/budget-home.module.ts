import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { BudgetHomePage } from './budget-home.page';
import { TranslateSharedLazyModuleModule } from '@picsa/core';
import { BudgetToolComponentsModule } from '../../components/budget-tool.components';
import { PicsaMaterialModule } from '../../material.module';
import { MobxAngularModule } from 'mobx-angular';

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
    TranslateSharedLazyModuleModule,
    PicsaMaterialModule,
    BudgetToolComponentsModule,
    MobxAngularModule
  ],
  declarations: [BudgetHomePage]
})
export class BudgetHomePageModule {}
